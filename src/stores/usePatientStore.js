import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

export const usePatientStore = create((set, get) => ({
  patients: [],
  total: 0, // total real desde Supabase (para paginación)
  selected: null,
  loading: false,
  saving: false,
  error: null,

  // ── Listado paginado server-side ──────────────────────────
  fetchPatients: async ({ search = "", page = 1, pageSize = 20 } = {}) => {
    set({ loading: true, error: null });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("patients")
      .select("*", { count: "exact" })
      .eq("active", true)
      .order("full_name")
      .range(from, to);

    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,dni.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) set({ error: error.message });
    else set({ patients: data ?? [], total: count ?? 0 });
    set({ loading: false });
  },

  // ── Detalle ───────────────────────────────────────────────
  fetchPatientById: async (id) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) set({ error: error.message });
    else set({ selected: data });
    set({ loading: false });
    return { data, error };
  },

  setSelected: (patient) => set({ selected: patient }),

  // ── Crear ─────────────────────────────────────────────────
  createPatient: async (payload) => {
    set({ saving: true, error: null });
    const { data, error } = await supabase
      .from("patients")
      .insert(payload)
      .select()
      .single();

    set({ saving: false });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    return { data, error: null };
  },

  // Crear rapidamente paciente en citas
  createQuickPatient: async ({ firstName, lastName }) => {
    set({ saving: true, error: null });
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) {
      set({ saving: false, error: "El nombre es requerido" });
      return { error: "El nombre es requerido" };
    }
    const { data, error } = await supabase
      .from("patients")
      .insert({ full_name: fullName, active: true })
      .select()
      .single();

    set({ saving: false });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    // Refrescar la lista de pacientes para que aparezca en el autocomplete
    await get().fetchPatients({ page: 1, pageSize: 200 });
    return { data, error: null };
  },

  // ── Actualizar ────────────────────────────────────────────
  updatePatient: async (id, payload) => {
    set({ saving: true, error: null });
    const { data, error } = await supabase
      .from("patients")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (!error) set({ selected: data });
    set({ saving: false });
    if (error) return { error: error.message };
    return { data, error: null };
  },

  // ── Borrado lógico ────────────────────────────────────────
  deletePatient: async (id) => {
    const { error } = await supabase
      .from("patients")
      .update({ active: false })
      .eq("id", id);

    return { error: error?.message ?? null };
  },
}));
