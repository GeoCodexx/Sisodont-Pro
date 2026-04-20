import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const usePatientStore = create((set, get) => ({
  patients: [],
  selected: null,
  loading: false,
  saving: false,
  error: null,

  // ── Listado ──────────────────────────────────────────────
  fetchPatients: async (search = '') => {
    set({ loading: true, error: null })

    let query = supabase
      .from('patients')
      .select('*')
      .eq('active', true)
      .order('full_name')

    if (search.trim()) {
      // Búsqueda por nombre o DNI
      query = query.or(
        `full_name.ilike.%${search}%,dni.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) set({ error: error.message })
    else set({ patients: data })
    set({ loading: false })
  },

  // ── Detalle ───────────────────────────────────────────────
  fetchPatientById: async (id) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) set({ error: error.message })
    else set({ selected: data })
    set({ loading: false })
    return { data, error }
  },

  setSelected: (patient) => set({ selected: patient }),

  // ── Crear ─────────────────────────────────────────────────
  createPatient: async (payload) => {
    set({ saving: true, error: null })
    const { data, error } = await supabase
      .from('patients')
      .insert(payload)
      .select()
      .single()

    if (error) {
      set({ error: error.message, saving: false })
      return { error: error.message }
    }

    set((s) => ({ patients: [data, ...s.patients], saving: false }))
    return { data, error: null }
  },

  // ── Actualizar ────────────────────────────────────────────
  updatePatient: async (id, payload) => {
    set({ saving: true, error: null })
    const { data, error } = await supabase
      .from('patients')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message, saving: false })
      return { error: error.message }
    }

    set((s) => ({
      patients: s.patients.map((p) => (p.id === id ? data : p)),
      selected: data,
      saving: false,
    }))
    return { data, error: null }
  },

  // ── Borrado lógico ────────────────────────────────────────
  deletePatient: async (id) => {
    const { error } = await supabase
      .from('patients')
      .update({ active: false })
      .eq('id', id)

    if (error) return { error: error.message }

    set((s) => ({
      patients: s.patients.filter((p) => p.id !== id),
    }))
    return { error: null }
  },
}))