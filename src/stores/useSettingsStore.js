import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";

// ─────────────────────────────────────────────────────────────
// useSettingsStore
//
// updated_by se resuelve internamente en updateSetting y
// updateMany — los componentes ya no pasan profile?.id.
// ─────────────────────────────────────────────────────────────

export const useSettingsStore = create((set, get) => ({
  settings: {}, // { clinic_name: "Mi Clínica", ... }
  loading: false,
  saving: false,
  error: null,

  // ── Cargar todos los settings ─────────────────────────────
  fetchSettings: async () => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("tenant_settings")
      .select("*")
      .maybeSingle();

    if (error) {
      set({
        error: error.message,
        loading: false,
      });
      return;
    }

    set({
      settings: data ?? {},
      loading: false,
    });
  },

  // ── Actualizar ettings ─────────────────────────────────
  updateSettings: async (values) => {
    set({ saving: true });

    const userId = useAuthStore.getState().user?.id ?? null;

    const tenantId = get().settings?.tenant_id;

    const { data, error } = await supabase
      .from("tenant_settings")
      .update({
        ...values,
        updated_by: userId,
      })
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (!error) {
      set({
        settings: data,
      });
    }

    set({ saving: false });

    return {
      error: error?.message ?? null,
    };
  },

  /*updateMany: async (updates) => {
    set({ saving: true });

    const userId = useAuthStore.getState().user?.id ?? null;
    const now = new Date().toISOString();
    const errors = [];

    for (const [key, value] of Object.entries(updates)) {
      const { error } = await supabase
        .from("settings")
        .update({ value, updated_by: userId, updated_at: now })
        .eq("key", key);
      if (error) errors.push(error.message);
    }

    if (!errors.length) {
      set((s) => ({ settings: { ...s.settings, ...updates } }));
    }
    set({ saving: false });
    return { error: errors.length ? errors.join(", ") : null };
  },*/

  // Limpiar store de configuracion
  clearSettings: () => {
    set({
      settings: {},
      loading: false,
      error: null,
    });
  },
}));
