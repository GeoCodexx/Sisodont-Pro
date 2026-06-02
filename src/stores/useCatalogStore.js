import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";

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
  treatments: [],
  treatmentsCatalog: [], // vista treatments_catalog (todos, con effective_price/active)
  doctors: [],
  odontogramActions: [],
  loading: false,
  saving: false,
  error: null,

  // ── Fetch completo en paralelo ────────────────────────────
  fetchAll: async () => {
    set({ loading: true, error: null });

    const [specs, treats, docs] = await Promise.all([
      supabase.from("specialties").select("*").eq("active", true).order("name"),
      supabase
        .from("treatments_catalog")
        .select("*, specialty:specialties(id, name, color)")
        .order("name"),
      supabase
        .from("doctors")
        .select(
          `
          *,
          profile:profiles(id, full_name, email, phone),
          specialty:specialties(id, name, color)
        `,
        )
        .eq("active", true)
        .order("created_at"),
    ]);

    set({
      specialties: specs.data ?? [],
      treatmentsCatalog: treats.data ?? [], // NUEVO — todos
      treatments: (treats.data ?? []).filter((t) => t.effective_active), // activos
      doctors: docs.data ?? [],
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

  /*createTreatment: async (payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("treatments")
      .insert(payload)
      .select("*, specialty:specialties(id, name, color)")
      .single();

    if (!error) set((s) => ({ treatments: [...s.treatments, data] }));
    set({ saving: false });
    return { data, error: error?.message ?? null };
  },*/
  createTreatment: async (payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("treatments")
      .insert(payload)
      .select("*, specialty:specialties(id, name, color)")
      .single();

    if (!error) {
      const entry = {
        ...data,
        is_tenant_own: false,
        base_price: data.price,
        custom_price: null,
        effective_price: data.unit_price ? data.unit_price : data.price,
        effective_active: data.active,
      };

      set((s) => ({
        treatmentsCatalog: [...s.treatmentsCatalog, entry],
        treatments: data.active ? [...s.treatments, entry] : s.treatments,
      }));
    }

    set({ saving: false });
    return { data, error: error?.message ?? null };
  },

  /*updateTreatment: async (id, payload) => {
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
  },*/
  updateTreatment: async (id, payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("treatments")
      .update(payload)
      .eq("id", id)
      .select("*, specialty:specialties(id, name, color)")
      .single();

    if (!error) {
      const entry = {
        ...data,
        is_tenant_own: false,
        base_price: data.price,
        custom_price: null,
        effective_price: data.unit_price ? data.unit_price : data.price,
        effective_active: data.active,
      };

      set((s) => ({
        // Actualizar o remover de treatmentsCatalog según active
        treatmentsCatalog: data.active
          ? s.treatmentsCatalog.map((t) => (t.id === id ? entry : t))
          : s.treatmentsCatalog.filter((t) => t.id !== id), // inactivo: desaparece para tenants
        treatments: s.treatments
          .filter((t) => t.id !== id)
          .concat(data.active ? [entry] : []),
      }));
    }
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

  // ── ACCIONES ODONTOGRAMA — solo SUPER_ADMIN ───────────────

  odontogramActions: [],

  fetchOdontogramActions: async () => {
    const { data } = await supabase
      .from("odontogram_actions")
      .select("*")
      .order("name");
    if (data) set({ odontogramActions: data });
  },

  createOdontogramAction: async (payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("odontogram_actions")
      .insert(payload)
      .select()
      .single();
    if (!error)
      set((s) => ({ odontogramActions: [...s.odontogramActions, data] }));
    set({ saving: false });
    return { data, error: error?.message ?? null };
  },

  updateOdontogramAction: async (id, payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("odontogram_actions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (!error)
      set((s) => ({
        odontogramActions: s.odontogramActions.map((x) =>
          x.id === id ? data : x,
        ),
      }));
    set({ saving: false });
    return { error: error?.message ?? null };
  },

  deleteOdontogramAction: async (id) => {
    const { error } = await supabase
      .from("odontogram_actions")
      .update({ active: false })
      .eq("id", id);
    if (!error)
      set((s) => ({
        odontogramActions: s.odontogramActions.filter((x) => x.id !== id),
      }));
    return { error: error?.message ?? null };
  },

  // ── DOCTORES — ADMIN del tenant ───────────────────────────

  createDoctor: async (payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("doctors")
      .insert(payload)
      .select(
        `
        *,
        profile:profiles(id, full_name, email, phone),
        specialty:specialties(id, name, color)
      `,
      )
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
      .select(
        `
        *,
        profile:profiles(id, full_name, email, phone),
        specialty:specialties(id, name, color)
      `,
      )
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

    if (!error) set((s) => ({ doctors: s.doctors.filter((x) => x.id !== id) }));
    return { error: error?.message ?? null };
  },

  // ── TRATAMIENTOS — ADMIN del tenant ──────────────────────────

  // Crear tratamiento propio del tenant (tenant_id lo pone el RLS/backend)
  createTenantTreatment: async (payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("treatments")
      .insert(payload)
      .select("*, specialty:specialties(id, name, color)")
      .single();

    if (!error) {
      // Agrega a ambas listas
      const entry = {
        ...data,
        effective_price: data.unit_price
          ? data.unit_price // si es por unidad, el precio efectivo es unit_price
          : data.price, // si es por sesión, es price
        effective_active: data.active,
        is_tenant_own: true,
      };
      set((s) => ({
        treatmentsCatalog: [...s.treatmentsCatalog, entry],
        treatments: data.active ? [...s.treatments, entry] : s.treatments,
      }));
    }
    set({ saving: false });
    return { data, error: error?.message ?? null };
  },

  updateTenantTreatment: async (id, payload) => {
    set({ saving: true });
    const { data, error } = await supabase
      .from("treatments")
      .update(payload)
      .eq("id", id)
      .select("*, specialty:specialties(id, name, color)")
      .single();

    if (!error) {
      const entry = {
        ...data,
        effective_price: data.unit_price ? data.unit_price : data.price,
        effective_active: data.active,
        is_tenant_own: true,
      };
      set((s) => ({
        treatmentsCatalog: s.treatmentsCatalog.map((x) =>
          x.id === id ? entry : x,
        ),
        treatments: s.treatments
          .filter((x) => x.id !== id)
          .concat(data.active ? [entry] : []),
      }));
    }
    set({ saving: false });
    return { error: error?.message ?? null };
  },

  // Upsert de precio y/o estado en tenant_treatment_config
  upsertTreatmentConfig: async (treatmentId, patch) => {
    // patch puede ser { custom_price }, { is_active } o ambos
    const userId = useAuthStore.getState().user?.id ?? null;

    const { data, error, status, statusText } = await supabase
      .from("tenant_treatment_config")
      .upsert(
        {
          treatment_id: treatmentId,
          ...patch,
          updated_by: userId,
        },
        { onConflict: "tenant_id,treatment_id" },
      )
      .select();

    console.log("upsert result:", { data, error, status, statusText });

    if (!error) {
      set((s) => {
        // 1. Construir el catálogo actualizado primero
        const updatedCatalog = s.treatmentsCatalog.map((t) => {
          if (t.id !== treatmentId) return t;
          const newActive = patch.is_active ?? t.effective_active; // ← aplica para globales Y propios
          const newPrice = patch.custom_price ?? t.custom_price;
          return {
            ...t,
            custom_price: newPrice,
            effective_active: newActive,
            effective_price: newPrice ?? t.base_price,
          };
        });

        return {
          treatmentsCatalog: updatedCatalog,
          treatments: updatedCatalog.filter((t) => t.effective_active), // ← desde updatedCatalog, no s.treatmentsCatalog
        };
      });
    }

    /*if (!error) {
      // Actualizar treatmentsCatalog en memoria
      set((s) => ({
        treatmentsCatalog: s.treatmentsCatalog.map((t) => {
          if (t.id !== treatmentId) return t;
          const newActive = t.is_tenant_own
            ? (patch.is_active ?? t.effective_active) // propio: el tenant controla
            : t.effective_active; // global: no cambia en memoria (t.active manda)
          const newPrice = patch.custom_price ?? t.custom_price;
          return {
            ...t,
            custom_price: newPrice,
            effective_active: newActive,
            effective_price: newPrice ?? t.base_price,
          };
        }),
        // Sincronizar treatments (solo activos)
        treatments: s.treatmentsCatalog
          .map((t) =>
            t.id !== treatmentId
              ? t
              : {
                  ...t,
                  effective_active: patch.is_active ?? t.effective_active,
                },
          )
          .filter((t) => t.effective_active),
      }));
    }*/
    return { error: error?.message ?? null };
  },
}));
