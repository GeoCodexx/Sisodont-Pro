import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

// ─────────────────────────────────────────────────────────────
// useDashboardStore — refactorizado
//
// Antes: calculaba KPIs solo desde appointments_full
//        ignorando treatment_cases y case_payments
//
// Ahora: lee desde financial_summary (view unificada) y
//        payments_monthly (datos reales desde ledger_entries)
//
// Resultado: KPIs correctos que incluyen AMBOS flujos
// ─────────────────────────────────────────────────────────────

export const useDashboardStore = create((set) => ({
  kpis: null,
  monthly: [],
  topTreatments: [],
  topDoctors: [],
  recentAppointments: [],
  loading: false,
  error: null,

  fetchDashboard: async ({ dateFrom, dateTo } = {}) => {
    set({ loading: true, error: null });

    try {
      const to = dateTo ? new Date(dateTo) : new Date();
      const from = dateFrom
        ? new Date(dateFrom)
        : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      to.setHours(23, 59, 59);

      const isoFrom = from.toISOString();
      const isoTo = to.toISOString();

      const [financialRes, appointmentsRes, monthlyRes, recentRes] =
        await Promise.all([
          // ── KPIs FINANCIEROS ─────────────────────────────
          // ── KPIs desde financial_summary (fuente unificada) ──
          // Incluye citas individuales Y casos multisesión
          supabase
            .from("financial_summary")
            .select(
              "ref_type, ref_id, status, case_status, billed, collected, balance, " +
                "patient_id, treatment_name, doctor_name",
            )
            .gte("date", isoFrom)
            .lte("date", isoTo),

          // ── KPIs OPERACIONALES / CALENDARIO ─────────────
          supabase
            .from("appointments_full")
            .select(
              "id, patient_id, status, case_id, case_status, treatment_name, doctor_name",
            )
            .gte("date", isoFrom)
            .lte("date", isoTo),

          // ── Tendencia mensual (últimos 12 meses) ─────────────
          // payments_monthly ahora usa ledger_entries como fuente
          supabase
            .from("payments_monthly")
            .select("*")
            .gte(
              "month",
              new Date(to.getFullYear() - 1, to.getMonth(), 1).toISOString(),
            )
            .order("month"),

          // ── Últimas 8 citas (para la tabla inferior) ─────────
          supabase
            .from("appointments_full")
            .select("*")
            .order("date", { ascending: false })
            .limit(8),
        ]);

      //const rows = summaryRes.data ?? [];
      const financialRows = financialRes.data ?? [];
      const appointmentRows = appointmentsRes.data ?? [];

      // ── KPIs unificados ───────────────────────────────────
      // Separar por tipo para métricas específicas
      //const apptRows = appointmentRows.filter((r) => r.ref_type === "appointment");
      const caseRows = financialRows.filter((r) => r.ref_type === "case");

      //const totalRefs = rows.length;
      const totalAppts = appointmentRows.length;
      const totalCases = caseRows.length;

      // Estados: los casos usan en_curso/completado/abandonado
      // Las citas usan pendiente/atendido/cancelado
      const attended = appointmentRows.filter(
        (r) => r.status === "atendido",
      ).length;
      const pending = appointmentRows.filter(
        (r) => r.status === "pendiente",
      ).length;
      const cancelled = appointmentRows.filter(
        (r) => r.status === "cancelado",
      ).length;
      const activeCases = caseRows.filter(
        (r) => r.status === "en_curso",
      ).length;

      // Financiero unificado (AMBOS flujos)
      const grossRevenue = financialRows.reduce(
        (s, r) => s + Number(r.billed ?? 0),
        0,
      );
      const collected = financialRows.reduce(
        (s, r) => s + Number(r.collected ?? 0),
        0,
      );

      const pendingBalance = financialRows.reduce(
        (s, r) =>
          r.ref_type === "case" && r.case_status === "abandonado"
            ? s // el balance de un caso abandonado no es deuda exigible
            : s + Number(r.balance ?? 0),
        0,
      );

      // Pacientes únicos en el período
      const uniquePatients = new Set(appointmentRows.map((r) => r.patient_id))
        .size;

      // ── Top tratamientos ───────────────────────────────────
      const treatMap = {};
      appointmentRows.forEach((r) => {
        if (!r.treatment_name) return;
        treatMap[r.treatment_name] = (treatMap[r.treatment_name] ?? 0) + 1;
      });
      const topTreatments = Object.entries(treatMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // ── Top doctores ───────────────────────────────────────
      const docMap = {};
      appointmentRows.forEach((r) => {
        if (!r.doctor_name) return;
        docMap[r.doctor_name] = (docMap[r.doctor_name] ?? 0) + 1;
      });
      const topDoctors = Object.entries(docMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // attendanceRate actualizado:
      const attendanceRate =
        totalAppts > 0 ? Math.round((attended / totalAppts) * 100) : 0;

      set({
        kpis: {
          // Citas
          totalAppts,
          attended,
          pending,
          cancelled,
          attendanceRate,
          /*attendanceRate:
            totalAppts > 0 ? Math.round((attended / totalAppts) * 100) : 0,*/
          // Casos multisesión
          totalCases,
          activeCases,
          // Global
          //totalRefs,
          uniquePatients,
          // Financiero unificado
          grossRevenue,
          collected,
          pendingBalance,
        },
        monthly: monthlyRes.data ?? [],
        topTreatments,
        topDoctors,
        recentAppointments: recentRes.data ?? [],
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));
