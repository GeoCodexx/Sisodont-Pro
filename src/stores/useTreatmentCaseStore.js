import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const useTreatmentCaseStore = create((set, get) => ({
  cases:    [],
  selected: null,
  loading:  false,
  saving:   false,
  error:    null,

  // ── Casos de un paciente ──────────────────────────────────
  fetchByPatient: async (patientId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('treatment_cases_full')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) set({ error: error.message })
    else set({ cases: data ?? [] })
    set({ loading: false })
    return data ?? []
  },

  // ── Buscar caso abierto (en_curso) de un paciente + tratamiento ──
  // Usado al crear una cita: si ya hay un caso abierto, lo reutiliza
  findOpenCase: async (patientId, treatmentId) => {
    const { data } = await supabase
      .from('treatment_cases')
      .select('*')
      .eq('patient_id',   patientId)
      .eq('treatment_id', treatmentId)
      .eq('status',       'en_curso')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data ?? null
  },

  // ── Crear nuevo caso ──────────────────────────────────────
  createCase: async (payload) => {
    set({ saving: true, error: null })
    const { data, error } = await supabase
      .from('treatment_cases')
      .insert(payload)
      .select()
      .single()

    set({ saving: false })
    if (error) { set({ error: error.message }); return { data: null, error: error.message } }
    return { data, error: null }
  },

  // ── Actualizar estado del caso ────────────────────────────
  updateCaseStatus: async (caseId, status) => {
    const ended_at = status !== 'en_curso' ? new Date().toISOString() : null
    const { error } = await supabase
      .from('treatment_cases')
      .update({ status, ended_at })
      .eq('id', caseId)

    if (!error) {
      set(s => ({
        cases: s.cases.map(c =>
          c.id === caseId ? { ...c, status, ended_at } : c
        ),
      }))
    }
    return { error: error?.message ?? null }
  },

  // ── Actualizar notas y sesiones planificadas ──────────────
  updateCase: async (caseId, payload) => {
    set({ saving: true })
    const { error } = await supabase
      .from('treatment_cases')
      .update(payload)
      .eq('id', caseId)
    set({ saving: false })
    return { error: error?.message ?? null }
  },

  setSelected: (c) => set({ selected: c }),
  clearCases:  ()  => set({ cases: [], selected: null }),
}))