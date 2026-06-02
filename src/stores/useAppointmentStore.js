import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";

export const useAppointmentStore = create((set, get) => ({
  appointments: [],
  selected: null,
  loading: false,
  saving: false,
  error: null,

  // ── Fetch para el calendario (rango de fechas) ────────────
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

  // ── Fetch historial de un paciente ────────────────────────
  fetchByPatient: async (patientId) => {
    const { data, error } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: false });

    if (error) return [];
    return data ?? [];
  },

  // ── Reload del selected (para refrescar el drawer) ────────
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

  // ── Crear ─────────────────────────────────────────────────
  // created_by se resuelve internamente, no viene del componente
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

    // Refrescar con la vista full para tener todos los campos join
    const { data: full } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("id", data.id)
      .single();

    if (full) set((s) => ({ appointments: [...s.appointments, full] }));
    return { data: full ?? data, error: null };
  },

  // ── Actualizar ────────────────────────────────────────────
  updateAppointment: async (id, payload) => {
    set({ saving: true, error: null });

    const { error } = await supabase
      .from("appointments")
      .update(payload)
      .eq("id", id);

    set({ saving: false });
    if (error) return { error: error.message };

    // Refrescar con la vista full
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

  // ── Cambiar estado (alias semántico de updateAppointment) ─
  changeStatus: async (id, status) => get().updateAppointment(id, { status }),

  // ── Eliminar ──────────────────────────────────────────────
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
      .neq("status", "cancelado") // canceladas no bloquean
      .lt("date", end) // empieza antes que termine la nueva
      .gt("end_date", start); // termina después que empiece la nueva

    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query;
    if (error) return { overlap: false, error: error.message };
    return {
      overlap: (data?.length ?? 0) > 0,
      conflicting: data ?? [],
      error: null,
    };
  },
}));
