import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

// ─────────────────────────────────────────────────────────────
// DISTRIBUCIÓN DE PERMISOS — Catálogo
//
// Especialidades  → SOLO SUPER_ADMIN  (catálogo global SaaS)
// Tratamientos    → SOLO SUPER_ADMIN  (catálogo global SaaS)
// Doctores        → ADMIN del tenant  (cada clínica gestiona los suyos)
//
// El RLS de Supabase enforce esto en el backend.
// El store no necesita validar roles — si el RLS
// rechaza la operación, devuelve error y la UI lo muestra.
// La UI usa `isSuperAdmin` del authStore para
// mostrar/ocultar botones de acción.
// ─────────────────────────────────────────────────────────────

export const useCatalogStore = create((set, get) => ({
  specialties: [],
  treatments:  [],
  doctors:     [],
  loading:     false,
  saving:      false,
  error:       null,

  // ── Fetch completo en paralelo ────────────────────────────
  fetchAll: async () => {
    set({ loading: true, error: null });

    const [specs, treats, docs] = await Promise.all([
      supabase
        .from("specialties")
        .select("*")
        .eq("active", true)
        .order("name"),
      supabase
        .from("treatments")
        .select("*, specialty:specialties(id, name, color)")
        .eq("active", true)
        .order("name"),
      supabase
        .from("doctors")
        .select(`
          *,
          profile:profiles(id, full_name, email, phone),
          specialty:specialties(id, name, color)
        `)
        .eq("active", true)
        .order("created_at"),
    ]);

    set({
      specialties: specs.data   ?? [],
      treatments:  treats.data  ?? [],
      doctors:     docs.data    ?? [],
      loading: false,
    });
  },

  // ── ESPECIALIDADES — solo SUPER_ADMIN ─────────────────────

  createSpecialty: async (payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("specialties")
      .insert(payload)
      .select()
      .single();

    if (!error) set((s) => ({ specialties: [...s.specialties, data] }));
    set({ saving: false });
    return { data, error: error?.message ?? null };
  },

  updateSpecialty: async (id, payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("specialties")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (!error)
      set((s) => ({
        specialties: s.specialties.map((x) => (x.id === id ? data : x)),
      }));
    set({ saving: false });
    return { error: error?.message ?? null };
  },

  deleteSpecialty: async (id) => {
    const { error } = await supabase
      .from("specialties")
      .update({ active: false })
      .eq("id", id);

    if (!error)
      set((s) => ({
        specialties: s.specialties.filter((x) => x.id !== id),
      }));
    return { error: error?.message ?? null };
  },

  // ── TRATAMIENTOS — solo SUPER_ADMIN ──────────────────────

  createTreatment: async (payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("treatments")
      .insert(payload)
      .select("*, specialty:specialties(id, name, color)")
      .single();

    if (!error) set((s) => ({ treatments: [...s.treatments, data] }));
    set({ saving: false });
    return { data, error: error?.message ?? null };
  },

  updateTreatment: async (id, payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("treatments")
      .update(payload)
      .eq("id", id)
      .select("*, specialty:specialties(id, name, color)")
      .single();

    if (!error)
      set((s) => ({
        treatments: s.treatments.map((x) => (x.id === id ? data : x)),
      }));
    set({ saving: false });
    return { error: error?.message ?? null };
  },

  deleteTreatment: async (id) => {
    const { error } = await supabase
      .from("treatments")
      .update({ active: false })
      .eq("id", id);

    if (!error)
      set((s) => ({
        treatments: s.treatments.filter((x) => x.id !== id),
      }));
    return { error: error?.message ?? null };
  },

  // ── DOCTORES — ADMIN del tenant ───────────────────────────

  createDoctor: async (payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("doctors")
      .insert(payload)
      .select(`
        *,
        profile:profiles(id, full_name, email, phone),
        specialty:specialties(id, name, color)
      `)
      .single();

    if (!error) set((s) => ({ doctors: [...s.doctors, data] }));
    set({ saving: false });
    return { data, error: error?.message ?? null };
  },

  updateDoctor: async (id, payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("doctors")
      .update(payload)
      .eq("id", id)
      .select(`
        *,
        profile:profiles(id, full_name, email, phone),
        specialty:specialties(id, name, color)
      `)
      .single();

    if (!error)
      set((s) => ({
        doctors: s.doctors.map((x) => (x.id === id ? data : x)),
      }));
    set({ saving: false });
    return { error: error?.message ?? null };
  },

  deleteDoctor: async (id) => {
    const { error } = await supabase
      .from("doctors")
      .update({ active: false })
      .eq("id", id);

    if (!error)
      set((s) => ({ doctors: s.doctors.filter((x) => x.id !== id) }));
    return { error: error?.message ?? null };
  },
}));