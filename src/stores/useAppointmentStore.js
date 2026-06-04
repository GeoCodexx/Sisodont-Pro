import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";

export const useAppointmentStore = create((set, get) => ({
  appointments: [],
  selected: null,
  loading: false,
  saving: false,
  error: null,

  fetchByRange: async (start, end) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("appointments_full")
      .select("*")
      .gte("date", start.toISOString())
      .lte("date", end.toISOString())
      .order("date");
    if (error) set({ error: error.message });
    else set({ appointments: data ?? [] });
    set({ loading: false });
  },

  fetchByPatient: async (patientId) => {
    const { data, error } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: false });
    if (error) return [];
    return data ?? [];
  },

  reloadSelected: async () => {
    const { selected } = get();
    if (!selected?.id) return;
    const { data } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("id", selected.id)
      .single();
    if (data) set({ selected: data });
  },

  createAppointment: async (payload) => {
    set({ saving: true, error: null });
    const userId = useAuthStore.getState().user?.id ?? null;
    const { data, error } = await supabase
      .from("appointments")
      .insert({ ...payload, created_by: userId })
      .select()
      .single();
    set({ saving: false });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    const { data: full } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("id", data.id)
      .single();
    if (full) set((s) => ({ appointments: [...s.appointments, full] }));
    return { data: full ?? data, error: null };
  },

  updateAppointment: async (id, payload) => {
    set({ saving: true, error: null });
    const { error } = await supabase
      .from("appointments")
      .update(payload)
      .eq("id", id);
    set({ saving: false });
    if (error) return { error: error.message };
    const { data: full } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("id", id)
      .single();
    if (full) {
      set((s) => ({
        appointments: s.appointments.map((a) => (a.id === id ? full : a)),
        selected: s.selected?.id === id ? full : s.selected,
      }));
    }
    return { error: null };
  },

  changeStatus: async (id, status) => get().updateAppointment(id, { status }),

  deleteAppointment: async (id) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (!error) {
      set((s) => ({
        appointments: s.appointments.filter((a) => a.id !== id),
        selected: s.selected?.id === id ? null : s.selected,
      }));
    }
    return { error: error?.message ?? null };
  },

  setSelected: (appt) => set({ selected: appt }),
  clearSelected: () => set({ selected: null }),

  checkOverlap: async (doctorId, start, end, excludeId = null) => {
    let query = supabase
      .from("appointments")
      .select("id, date, end_date")
      .eq("doctor_id", doctorId)
      .neq("status", "cancelado")
      .lt("date", end)
      .gt("end_date", start);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query;
    if (error) return { overlap: false, error: error.message };
    return {
      overlap: (data?.length ?? 0) > 0,
      conflicting: data ?? [],
      error: null,
    };
  },

  // ══════════════════════════════════════════════════════════════════════
  // smartCancelOrDelete
  // Aplica la lógica de negocio correcta según tipo de tratamiento y pagos.
  // Usa direction='egreso' en ledger_entries para devoluciones (nunca
  // amount negativo ni method="devolución").
  //
  // Casos:
  //  Multisesión · 1ª cita · sin pagos  → DELETE cita + caso "abandonado"
  //  Multisesión · 1ª cita · con pagos  → UPDATE cita "cancelado" (caso queda en_curso)
  //  Multisesión · cita intermedia      → UPDATE cita "cancelado" (caso intacto)
  //  Sesión única · sin pagos           → DELETE cita
  //  Sesión única · con pagos           → UPDATE "cancelado" + ledger egreso
  //
  // Retorna { action, error, warning }
  //   action: "deleted" | "cancelled" | "cancelled_with_refund"
  // ══════════════════════════════════════════════════════════════════════
  smartCancelOrDelete: async (
    appt,
    cancelNotes = "",
    refundMethod = "efectivo",
  ) => {
    set({ saving: true, error: null });
    const userId = useAuthStore.getState().user?.id ?? null;

    const isMultisession = !!appt.is_multisession && !!appt.case_id;
    const paid = Number(appt.paid ?? 0);
    const hasPaid = paid > 0;

    // ── Helpers ───────────────────────────────────────────────────────
    const cancelAppt = async () => {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelado",
          ...(cancelNotes ? { notes: cancelNotes } : {}),
        })
        .eq("id", appt.id);
      return error;
    };

    const deleteAppt = async () => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appt.id);
      return error;
    };

    const removeFromStore = () => {
      set((s) => ({
        appointments: s.appointments.filter((a) => a.id !== appt.id),
        selected: s.selected?.id === appt.id ? null : s.selected,
      }));
    };

    const refreshInStore = async () => {
      const { data: full } = await supabase
        .from("appointments_full")
        .select("*")
        .eq("id", appt.id)
        .single();
      if (full) {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appt.id ? full : a,
          ),
          selected: s.selected?.id === appt.id ? full : s.selected,
        }));
      }
    };

    // ── Registrar devolución en ledger (direction = 'egreso') ─────────
    // amount siempre positivo; direction indica que es un egreso.
    const insertRefund = async ({
      refType,
      refId,
      amount,
      reason,
      method = "efectivo",
    }) => {
      const { error } = await supabase.from("ledger_entries").insert({
        ref_type: refType,
        ref_id: refId,
        amount,
        direction: "egreso",
        method, // canal recibido como parámetro
        notes: reason || null,
        refund_reason: reason || null,
        created_by: userId,
      });
      return error;
    };

    // ════════════════════════════════════════════════════════════════════
    // CASO A — MULTISESIÓN
    // ════════════════════════════════════════════════════════════════════
    if (isMultisession) {
      const { data: siblings, error: sibErr } = await supabase
        .from("appointments")
        .select("id, status, date")
        .eq("case_id", appt.case_id)
        .order("date", { ascending: true });

      if (sibErr) {
        set({ saving: false, error: sibErr.message });
        return { action: null, error: sibErr.message };
      }

      // La primera cita cronológica del caso (sin importar su estado actual)
      const firstInCase = siblings?.[0];
      const isFirstAppointment = firstInCase?.id === appt.id;

      // ¿El caso tiene algún pago registrado? (independiente de la cita puntual)
      // Esto se consulta separado porque appt.paid puede ser solo el de esta cita.
      const { data: caseLedger } = await supabase
        .from("ledger_entries")
        .select("id, direction, amount")
        .eq("ref_type", "case")
        .eq("ref_id", appt.case_id)
        .eq("direction", "ingreso")
        .limit(1);

      const caseHasPaid = (caseLedger?.length ?? 0) > 0;

      // A1 — 1ª cita sin pagos: eliminar cita + marcar caso abandonado
      if (isFirstAppointment && !caseHasPaid) {
        const delErr = await deleteAppt();
        if (delErr) {
          set({ saving: false, error: delErr.message });
          return { action: null, error: delErr.message };
        }

        const { error: caseErr } = await supabase
          .from("treatment_cases")
          .update({
            status: "abandonado",
            ended_at: new Date().toISOString(),
            ...(cancelNotes ? { notes: cancelNotes } : {}),
          })
          .eq("id", appt.case_id);

        removeFromStore();
        set({ saving: false });
        if (caseErr)
          return {
            action: "deleted",
            warning: `Cita eliminada, pero el caso no se pudo marcar como abandonado: ${caseErr.message}`,
            error: null,
          };
        return { action: "deleted", error: null };
      }

      // A2 — 1ª cita con pagos: cancelar cita, caso queda en_curso
      if (isFirstAppointment && caseHasPaid) {
        const cancelErr = await cancelAppt();
        if (cancelErr) {
          set({ saving: false, error: cancelErr.message });
          return { action: null, error: cancelErr.message };
        }
        await refreshInStore();
        set({ saving: false });
        return { action: "cancelled", error: null };
      }

      // A3 — Cita intermedia: solo cancelar cita
      const cancelErr = await cancelAppt();
      if (cancelErr) {
        set({ saving: false, error: cancelErr.message });
        return { action: null, error: cancelErr.message };
      }
      await refreshInStore();
      set({ saving: false });
      return { action: "cancelled", error: null };
    }

    // ════════════════════════════════════════════════════════════════════
    // CASO B — SESIÓN ÚNICA
    // ════════════════════════════════════════════════════════════════════

    // B1 — sin pagos: eliminar
    if (!hasPaid) {
      const delErr = await deleteAppt();
      if (delErr) {
        set({ saving: false, error: delErr.message });
        return { action: null, error: delErr.message };
      }
      removeFromStore();
      set({ saving: false });
      return { action: "deleted", error: null };
    }

    // B2 — con pagos: cancelar + registrar egreso en ledger
    const cancelErr = await cancelAppt();
    if (cancelErr) {
      set({ saving: false, error: cancelErr.message });
      return { action: null, error: cancelErr.message };
    }

    const refundErr = await insertRefund({
      refType: "appointment",
      refId: appt.id,
      amount: paid,
      reason:
        cancelNotes ||
        `Devolución por cancelación de cita — ${new Date(appt.date).toLocaleDateString("es-PE")}`,
      method: refundMethod,
    });

    await refreshInStore();
    set({ saving: false });

    if (refundErr) {
      return {
        action: "cancelled",
        warning: `Cita cancelada, pero no se pudo registrar la devolución: ${refundErr.message}`,
        error: null,
      };
    }
    return { action: "cancelled_with_refund", error: null };
  },

  // ══════════════════════════════════════════════════════════════════════
  // abandonTreatmentCase
  // Abandona un caso multisesión que ya tiene pagos adelantados.
  // Registra una devolución (egreso) en ledger_entries por el saldo
  // cobrado y marca el caso como "abandonado".
  //
  // Parámetros:
  //   caseId       – UUID del treatment_case
  //   paidAmount   – monto total cobrado al paciente (lo que se devuelve)
  //   refundNotes  – motivo del reembolso (texto del usuario)
  //   refundMethod – canal de devolución (efectivo, transferencia, etc.)
  //
  // Retorna { error }
  // ══════════════════════════════════════════════════════════════════════
  abandonTreatmentCase: async (
    caseId,
    paidAmount,
    refundNotes = "",
    refundMethod = "efectivo",
  ) => {
    set({ saving: true, error: null });
    const userId = useAuthStore.getState().user?.id ?? null;

    // 1. Marcar caso como abandonado
    const { error: caseErr } = await supabase
      .from("treatment_cases")
      .update({
        status: "abandonado",
        ended_at: new Date().toISOString(),
        ...(refundNotes ? { notes: refundNotes } : {}),
      })
      .eq("id", caseId);

    if (caseErr) {
      set({ saving: false, error: caseErr.message });
      return { error: caseErr.message };
    }

    // 2. Si había pagos, registrar devolución como egreso
    if (paidAmount > 0) {
      const { error: ledgerErr } = await supabase
        .from("ledger_entries")
        .insert({
          ref_type: "case",
          ref_id: caseId,
          amount: paidAmount, // siempre positivo
          direction: "egreso", // indica que es devolución
          method: refundMethod, // canal real de la devolución
          notes: refundNotes || null,
          refund_reason:
            refundNotes || `Devolución por abandono del caso de tratamiento`,
          created_by: userId,
        });

      if (ledgerErr) {
        set({ saving: false });
        // El caso ya quedó abandonado; advertir del fallo en ledger
        return {
          error: null,
          warning: `Caso marcado como abandonado, pero no se pudo registrar la devolución: ${ledgerErr.message}`,
        };
      }
    }

    set({ saving: false });
    return { error: null };
  },

  cancelAppointment: async (
    appt,
    cancelNotes = "",
    refundMethod = "efectivo",
  ) => {
    set({ saving: true, error: null });

    const userId = useAuthStore.getState().user?.id ?? null;

    const paid = Number(appt.paid ?? 0);

    const { error: cancelErr } = await supabase
      .from("appointments")
      .update({
        status: "cancelado",
        ...(cancelNotes ? { notes: cancelNotes } : {}),
      })
      .eq("id", appt.id);

    if (cancelErr) {
      set({ saving: false });
      return { error: cancelErr.message };
    }

    // Si existían pagos registrar devolución
    if (paid > 0) {
      const { error: refundErr } = await supabase
        .from("ledger_entries")
        .insert({
          ref_type: appt.case_id ? "case" : "appointment",
          ref_id: appt.case_id ?? appt.id,
          amount: paid,
          direction: "egreso",
          method: refundMethod,
          notes: cancelNotes || null,
          refund_reason: cancelNotes || "Devolución por cancelación",
          created_by: userId,
        });

      if (refundErr) {
        set({ saving: false });

        return {
          action: "cancelled",
          warning:
            "La cita fue cancelada pero no se pudo registrar la devolución.",
          error: null,
        };
      }
    }

    await get().reloadSelected();

    set({ saving: false });

    return {
      action: paid > 0 ? "cancelled_with_refund" : "cancelled",
      error: null,
    };
  },
}));
