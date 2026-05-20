import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";

// URL Edge Function create-user (para activar portal de paciente)
const EDGE_CREATE_USER = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;

// Helpers
const normalizeText = (text = "") =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const patientExists = (patients, fullName) => {
  const normalized = normalizeText(fullName);

  return patients.find((p) => normalizeText(p.full_name) === normalized);
};

export const usePatientStore = create((set, get) => ({
  patients: [],
  total: 0,
  selected: null,
  loading: false,
  saving: false,
  error: null,

  // ── Listado paginado con búsqueda ─────────────────────────
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

    if (search.trim())
      query = query.or(`full_name.ilike.%${search}%,dni.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) set({ error: error.message });
    else set({ patients: data ?? [], total: count ?? 0 });
    set({ loading: false });
  },

  // ── Detalle de paciente ───────────────────────────────────
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

  // ── Crear paciente (formulario completo) ──────────────────
  createPatient: async (payload) => {
    set({ saving: true, error: null });

    const existingByDni = get().patients.find(
      (p) => p.dni && payload.dni && p.dni === payload.dni,
    );

    if (existingByDni) {
      set({
        saving: false,
        error: "Ya existe un paciente con ese DNI.",
      });

      return {
        error: "Ya existe un paciente con este DNI.",
      };
    }

    const existing = patientExists(get().patients, payload.full_name);

    if (existing) {
      set({
        saving: false,
        error: "Ya existe un paciente con ese nombre.",
      });

      return {
        error: "Ya existe un paciente con ese nombre.",
      };
    }

    const { data, error } = await supabase
      .from("patients")
      .insert(payload)
      .select()
      .single();

    set({ saving: false });

    if (error) {
      set({ error: error.message });

      return {
        error: error.message,
      };
    }

    return { data, error: null };
  },

  // ── Crear paciente rápido (solo nombre, para citas) ───────
  createQuickPatient: async (payload) => {
    set({ saving: true, error: null });

    const existing = patientExists(get().patients, payload.full_name);

    if (existing) {
      set({
        saving: false,
        error: "Ya existe un paciente con ese nombre.",
      });

      return {
        error: "Ya existe un paciente con ese nombre.",
      };
    }

    const { data, error } = await supabase
      .from("patients")
      .insert(payload)
      .select()
      .single();

    set({ saving: false });

    if (error) {
      set({ error: error.message });

      return {
        data: null,
        error: error.message,
      };
    }

    return { data, error: null };
  },

  // ── Actualizar paciente ───────────────────────────────────
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

  // ── Desactivar paciente (soft delete) ────────────────────
  deletePatient: async (id) => {
    const { error } = await supabase
      .from("patients")
      .update({ active: false })
      .eq("id", id);
    return { error: error?.message ?? null };
  },

  // ─────────────────────────────────────────────────────────
  // ACCESO AL PORTAL
  // Flujo: ADMIN activa portal desde PatientDetailPage.
  // 1. Crea cuenta en auth via Edge Function (rol PATIENT)
  // 2. Vincula patients.user_id al nuevo profile
  // ─────────────────────────────────────────────────────────

  activatePortalAccess: async ({ patientId, email, password }) => {
    set({ saving: true });

    try {
      const session = useAuthStore.getState().session;
      const patient = get().selected;

      // 1. Crear cuenta via Edge Function
      const res = await fetch(EDGE_CREATE_USER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          password,
          full_name: patient?.full_name ?? "",
          role: "PATIENT",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        set({ saving: false });
        return { error: json.error ?? "Error al crear cuenta" };
      }

      // 2. Vincular patients.user_id
      const newUserId = json.user?.id;
      if (!newUserId) {
        set({ saving: false });
        return { error: "No se pudo obtener el ID del usuario creado" };
      }

      const { error: linkError } = await supabase
        .from("patients")
        .update({ user_id: newUserId })
        .eq("id", patientId);

      if (linkError) {
        set({ saving: false });
        return { error: linkError.message };
      }

      // Actualizar selected localmente
      set((s) => ({
        selected: s.selected
          ? { ...s.selected, user_id: newUserId }
          : s.selected,
        saving: false,
      }));

      return { error: null };
    } catch (err) {
      set({ saving: false });
      return { error: err.message };
    }
  },

  // Desvincula el acceso al portal (no elimina la cuenta auth,
  // solo rompe la relación patients.user_id)
  deactivatePortalAccess: async (patientId) => {
    set({ saving: true });

    const { error } = await supabase
      .from("patients")
      .update({ user_id: null })
      .eq("id", patientId);

    if (!error) {
      set((s) => ({
        selected: s.selected ? { ...s.selected, user_id: null } : s.selected,
      }));
    }

    set({ saving: false });
    return { error: error?.message ?? null };
  },
}));
