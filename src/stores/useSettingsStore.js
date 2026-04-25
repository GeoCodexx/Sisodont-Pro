import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const useSettingsStore = create((set, get) => ({
  settings: {},    // { clinic_name: 'Mi Clínica', ... }
  loading:  false,
  saving:   false,
  error:    null,

  // ── Cargar todos los settings ─────────────────────────────
  fetchSettings: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key')

    if (error) { set({ error: error.message, loading: false }); return }

    // Convertir array [{key, value}] → objeto { key: value }
    const map = Object.fromEntries(
      (data ?? []).map(s => [s.key, s.value])
    )
    set({ settings: map, loading: false })
  },

  // ── Actualizar un setting ─────────────────────────────────
  updateSetting: async (key, value, updatedBy) => {
    set({ saving: true })
    const { error } = await supabase
      .from('settings')
      .update({ value, updated_by: updatedBy, updated_at: new Date().toISOString() })
      .eq('key', key)

    if (!error) {
      set(s => ({ settings: { ...s.settings, [key]: value } }))
    }
    set({ saving: false })
    return { error: error?.message ?? null }
  },

  // ── Actualizar varios settings a la vez ───────────────────
  updateMany: async (updates, updatedBy) => {
    set({ saving: true })
    const errors = []
    for (const [key, value] of Object.entries(updates)) {
      const { error } = await supabase
        .from('settings')
        .update({ value, updated_by: updatedBy, updated_at: new Date().toISOString() })
        .eq('key', key)
      if (error) errors.push(error.message)
    }
    if (!errors.length) {
      set(s => ({ settings: { ...s.settings, ...updates } }))
    }
    set({ saving: false })
    return { error: errors.length ? errors.join(', ') : null }
  },
}))