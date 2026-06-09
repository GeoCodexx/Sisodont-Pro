import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

// ─────────────────────────────────────────────────────────────
// useSuperAdminStore
//
// Solo accesible para SUPER_ADMIN.
// El RLS de Supabase enforce esto — cualquier query aquí
// fallará silenciosamente para roles sin bypass.
//
// MODELO FINANCIERO (importante):
//   - appointments.total  → monto facturado por cita individual
//   - treatment_cases.total_cost → monto facturado por caso multisesión
//   - ledger_entries.amount (ref_type='appointment') → cobros de citas
//   - ledger_entries.amount (ref_type='case')        → cobros de casos
//   - appointments.paid NO EXISTE en la tabla base; el campo `paid`
//     solo aparece calculado en la vista appointments_full.
// ─────────────────────────────────────────────────────────────

export const useSuperAdminStore = create((set, get) => ({
  tenants: [],
  selected: null,
  kpis: null,
  loading: false,
  saving: false,
  error: null,

  // ── KPIs globales del SaaS ────────────────────────────────
  // Se calculan siempre junto con fetchTenants para no duplicar
  // llamadas a la DB. Se exponen por separado por si se necesita
  // refrescar solo los KPIs (ej. polling).
  fetchGlobalKpis: async () => {
    const [tenantsRes, profilesRes, apptsRes, casesRes, ledgerRes] =
      await Promise.all([
        supabase.from("tenants").select("id, active"),

        supabase
          .from("profiles")
          .select("id, role, tenant_id, created_at")
          .neq("role", "SUPER_ADMIN"),

        // Solo citas sin caso (citas individuales). El total facturado
        // de casos multisesión viene de treatment_cases.total_cost.
        supabase
          .from("appointments")
          .select("id, status, total, tenant_id, case_id"),

        supabase
          .from("treatment_cases")
          .select("id, status, total_cost, tenant_id"),

        // Fuente de verdad para cobros reales
        supabase
          .from("ledger_entries")
          .select("id, amount, direction, tenant_id"),
      ]);

    const tenants = tenantsRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const appts = apptsRes.data ?? [];
    const cases = casesRes.data ?? [];
    const ledger = ledgerRes.data ?? [];

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.active).length;
    const totalUsers = profiles.length;
    const totalAppts = appts.length;

    // Facturado = citas individuales + casos multisesión
    const grossFromAppts = appts
      .filter((a) => a.case_id === null)
      .reduce((s, a) => s + Number(a.total ?? 0), 0);
    const grossFromCases = cases.reduce(
      (s, c) => s + Number(c.total_cost ?? 0),
      0,
    );
    const grossRevenue = grossFromAppts + grossFromCases;

    // Cobrado real desde ledger_entries (fuente de verdad)
    const collected = ledger.reduce(
      (s, e) =>
        s +
        (e.direction === "egreso"
          ? -Number(e.amount ?? 0)
          : Number(e.amount ?? 0)),
      0,
    );

    const activeCases = cases.filter((c) => c.status === "en_curso").length;

    set({
      kpis: {
        totalTenants,
        activeTenants,
        inactiveTenants: totalTenants - activeTenants,
        totalUsers,
        totalAppts,
        grossRevenue,
        collected,
        pendingBalance: grossRevenue - collected,
        activeCases,
      },
    });
  },

  // ── Lista de tenants con métricas por clínica ─────────────
  fetchTenants: async () => {
    set({ loading: true, error: null });

    const [tenantsRes, profilesRes, apptsRes, casesRes, ledgerRes] =
      await Promise.all([
        supabase
          .from("tenants")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("id, tenant_id, role")
          .neq("role", "SUPER_ADMIN"),

        // Traemos case_id para saber si es cita individual
        supabase
          .from("appointments")
          .select("id, tenant_id, status, total, date, case_id"),

        supabase
          .from("treatment_cases")
          .select("id, tenant_id, status, total_cost"),

        supabase
          .from("ledger_entries")
          .select("id, tenant_id, amount, direction"),
      ]);

    const tenants = tenantsRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const appts = apptsRes.data ?? [];
    const cases = casesRes.data ?? [];
    const ledger = ledgerRes.data ?? [];

    // Agregar métricas correctas por tenant
    const enriched = tenants.map((t) => {
      const tProfiles = profiles.filter((p) => p.tenant_id === t.id);
      const tAppts = appts.filter((a) => a.tenant_id === t.id);
      const tCases = cases.filter((c) => c.tenant_id === t.id);
      const tLedger = ledger.filter((e) => e.tenant_id === t.id);

      const attended = tAppts.filter((a) => a.status === "atendido");

      // Última actividad: la cita más reciente
      const sortedAppts = [...tAppts].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
      const lastAppt = sortedAppts[0];

      // Facturado real: citas individuales + casos
      const grossFromAppts = tAppts
        .filter((a) => a.case_id === null)
        .reduce((s, a) => s + Number(a.total ?? 0), 0);
      const grossFromCases = tCases.reduce(
        (s, c) => s + Number(c.total_cost ?? 0),
        0,
      );
      const gross_revenue = grossFromAppts + grossFromCases;

      // Cobrado real desde ledger_entries del tenant
      const collected = tLedger.reduce(
        (s, e) =>
          s +
          (e.direction === "egreso"
            ? -Number(e.amount ?? 0)
            : Number(e.amount ?? 0)),
        0,
      );

      return {
        ...t,
        users_count: tProfiles.length,
        appts_count: tAppts.length,
        appts_attended: attended.length,
        active_cases: tCases.filter((c) => c.status === "en_curso").length,
        gross_revenue,
        collected,
        pending_balance: gross_revenue - collected,
        last_activity: lastAppt?.date ?? null,
      };
    });

    set({ tenants: enriched, loading: false });

    // Calcular KPIs globales a partir de los mismos datos ya bajados
    // para evitar un segundo round-trip completo a la DB.
    const allProfiles = profiles;
    const allAppts = appts;
    const allCases = cases;
    const allLedger = ledger;

    const totalTenants = enriched.length;
    const activeTenants = enriched.filter((t) => t.active).length;
    const totalUsers = allProfiles.length;
    const totalAppts = allAppts.length;

    const grossFromAppts = allAppts
      .filter((a) => a.case_id === null)
      .reduce((s, a) => s + Number(a.total ?? 0), 0);
    const grossFromCases = allCases.reduce(
      (s, c) => s + Number(c.total_cost ?? 0),
      0,
    );
    const grossRevenue = grossFromAppts + grossFromCases;
    const collected = allLedger.reduce(
      (s, e) =>
        s +
        (e.direction === "egreso"
          ? -Number(e.amount ?? 0)
          : Number(e.amount ?? 0)),
      0,
    );
    const activeCases = allCases.filter((c) => c.status === "en_curso").length;

    set({
      kpis: {
        totalTenants,
        activeTenants,
        inactiveTenants: totalTenants - activeTenants,
        totalUsers,
        totalAppts,
        grossRevenue,
        collected,
        pendingBalance: grossRevenue - collected,
        activeCases,
      },
    });
  },

  // ── Detalle de un tenant ──────────────────────────────────
  fetchTenantById: async (id) => {
    set({ loading: true, error: null });

    const [tenantRes, profilesRes, apptsRes, casesRes, ledgerRes] =
      await Promise.all([
        supabase.from("tenants").select("*").eq("id", id).single(),

        supabase
          .from("profiles")
          .select("id, full_name, email, role, active, created_at")
          .eq("tenant_id", id)
          .neq("role", "SUPER_ADMIN")
          .order("created_at", { ascending: false }),

        // appointments_full incluye: patient_name, doctor_name,
        // treatment_name, paid (calculado desde ledger_entries), balance
        supabase
          .from("appointments_full")
          .select(
            "id, date, status, total, paid, balance, " +
              "patient_name, doctor_name, treatment_name, " +
              "tenant_id, case_id",
          )
          .eq("tenant_id", id)
          .order("date", { ascending: false })
          .limit(10),

        // treatment_cases_full incluye: patient_name, doctor_name,
        // treatment_name, sessions_attended, sessions_total,
        // sessions_pending, total_paid, total_billed, total_balance
        supabase
          .from("treatment_cases_full")
          .select(
            "id, status, patient_name, doctor_name, treatment_name, " +
              "sessions_attended, sessions_total, sessions_pending, " +
              "total_paid, total_billed, total_balance, " +
              "started_at, tenant_id",
          )
          .eq("tenant_id", id)
          .eq("status", "en_curso")
          .order("started_at", { ascending: false })
          .limit(5),

        // Totales financieros reales del tenant completo
        // (no limitados a los últimos 10 como las vistas paginadas)
        Promise.all([
          supabase
            .from("appointments")
            .select("id, total, case_id, status")
            .eq("tenant_id", id),
          supabase
            .from("treatment_cases")
            .select("id, total_cost, status")
            .eq("tenant_id", id),
          supabase
            .from("ledger_entries")
            .select("id, amount, direction")
            .eq("tenant_id", id),
        ]),
      ]);

    if (tenantRes.error) {
      set({ error: tenantRes.error.message, loading: false });
      return;
    }

    // Desempacar el Promise.all anidado
    const [allApptsRes, allCasesRes, allLedgerRes] = ledgerRes;
    const allAppts = allApptsRes.data ?? [];
    const allCases = allCasesRes.data ?? [];
    const allLedger = allLedgerRes.data ?? [];

    // Métricas financieras reales del tenant (datos completos, no sample)
    const grossFromAppts = allAppts
      .filter((a) => a.case_id === null)
      .reduce((s, a) => s + Number(a.total ?? 0), 0);
    const grossFromCases = allCases.reduce(
      (s, c) => s + Number(c.total_cost ?? 0),
      0,
    );
    const totalGross = grossFromAppts + grossFromCases;
    const totalCollected = allLedger.reduce(
      (s, e) =>
        s +
        (e.direction === "egreso"
          ? -Number(e.amount ?? 0)
          : Number(e.amount ?? 0)),
      0,
    );

    set({
      selected: {
        ...tenantRes.data,
        profiles: profilesRes.data ?? [],
        recent_appointments: apptsRes.data ?? [],
        active_cases: casesRes.data ?? [],
        // Métricas financieras totales del tenant (no parciales)
        stats: {
          total_appts: allAppts.length,
          appts_attended: allAppts.filter((a) => a.status === "atendido")
            .length,
          total_cases: allCases.length,
          active_cases_count: allCases.filter((c) => c.status === "en_curso")
            .length,
          gross_revenue: totalGross,
          collected: totalCollected,
          pending_balance: totalGross - totalCollected,
        },
      },
      loading: false,
    });
  },

  // ── Activar / desactivar tenant ───────────────────────────
  toggleTenantActive: async (id, currentActive) => {
    set({ saving: true });
    const { error } = await supabase
      .from("tenants")
      .update({ active: !currentActive })
      .eq("id", id);

    if (!error) {
      set((s) => ({
        tenants: s.tenants.map((t) =>
          t.id === id ? { ...t, active: !currentActive } : t,
        ),
        selected:
          s.selected?.id === id
            ? { ...s.selected, active: !currentActive }
            : s.selected,
      }));
    }
    set({ saving: false });
    return { error: error?.message ?? null };
  },
}));
