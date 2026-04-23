import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const useAppointmentStore = create((set, get) => ({
  appointments: [],
  selected:     null,
  loading:      false,
  saving:       false,
  error:        null,

  // ── Fetch para el calendario (rango de fechas) ────────────
  fetchByRange: async (start, end) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('appointments_full')
      .select('*')
      .gte('date', start.toISOString())
      .lte('date', end.toISOString())
      .order('date')

    if (error) set({ error: error.message })
    else set({ appointments: data })
    set({ loading: false })
  },

  // ── Fetch historial de un paciente ────────────────────────
  fetchByPatient: async (patientId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('appointments_full')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })

    if (error) set({ error: error.message })
    else set({ appointments: data })
    set({ loading: false })
    return data ?? []
  },

  // ── Crear ─────────────────────────────────────────────────
  createAppointment: async (payload) => {
    set({ saving: true, error: null })
    const { data, error } = await supabase
      .from('appointments')
      .insert(payload)
      .select()
      .single()

    set({ saving: false })
    if (error) return { error: error.message }

    // Refrescar sin recargar todo el rango
    const full = await supabase
      .from('appointments_full')
      .select('*')
      .eq('id', data.id)
      .single()

    if (full.data) {
      set(s => ({ appointments: [...s.appointments, full.data] }))
    }
    return { data: full.data ?? data, error: null }
  },

  // ── Actualizar ────────────────────────────────────────────
  updateAppointment: async (id, payload) => {
    set({ saving: true, error: null })
    const { error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', id)

    set({ saving: false })
    if (error) return { error: error.message }

    const full = await supabase
      .from('appointments_full')
      .select('*')
      .eq('id', id)
      .single()

    if (full.data) {
      set(s => ({
        appointments: s.appointments.map(a => a.id === id ? full.data : a),
        selected: full.data,
      }))
    }
    return { error: null }
  },

  // ── Cambiar estado ────────────────────────────────────────
  changeStatus: async (id, status) => {
    return get().updateAppointment(id, { status })
  },

  // ── Eliminar ──────────────────────────────────────────────
  deleteAppointment: async (id) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (!error) {
      set(s => ({ appointments: s.appointments.filter(a => a.id !== id), selected: null }))
    }
    return { error: error?.message ?? null }
  },

  setSelected: (appt) => set({ selected: appt }),
  clearSelected: ()   => set({ selected: null }),
}))