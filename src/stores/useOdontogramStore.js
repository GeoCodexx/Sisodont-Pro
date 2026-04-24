import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'
import { initialOdontogramData, emptyTooth, DEFAULT_ACTIONS } from '../pages/odontogram/odontogramConstants'

export const useOdontogramStore = create((set, get) => ({
  data:          null,   // { teeth: [...] }
  odontogramId:  null,
  actions:       DEFAULT_ACTIONS,
  selectedTooth: null,   // número FDI del diente activo
  selectedAction: null,  // acción actual seleccionada
  loading:       false,
  saving:        false,
  dirty:         false,  // hay cambios sin guardar
  error:         null,

  // ── Cargar acciones desde BD ──────────────────────────────
  fetchActions: async () => {
    const { data } = await supabase
      .from('odontogram_actions')
      .select('*')
      .eq('active', true)
      .order('name')
    if (data?.length) set({ actions: data })
  },

  // ── Cargar odontograma del paciente ───────────────────────
  fetchOdontogram: async (patientId) => {
    set({ loading: true, error: null, dirty: false })
    const { data, error } = await supabase
      .from('odontograms')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle()

    if (error) { set({ error: error.message, loading: false }); return }

    if (data) {
      // Asegurar que todos los 32 dientes estén presentes
      const loaded    = data.data?.teeth ?? []
      const loadedMap = Object.fromEntries(loaded.map(t => [t.number, t]))
      const allTeeth  = initialOdontogramData().teeth.map(t =>
        loadedMap[t.number] ?? t
      )
      set({ data: { teeth: allTeeth }, odontogramId: data.id, loading: false })
    } else {
      // Crear estructura vacía para este paciente
      set({ data: initialOdontogramData(), odontogramId: null, loading: false })
    }
  },

  // ── Seleccionar diente y cara ─────────────────────────────
  selectTooth: (number) => set({ selectedTooth: number }),
  selectAction: (action) => set({ selectedAction: action }),

  // ── Pintar una cara ───────────────────────────────────────
  paintFace: (toothNumber, face) => {
    const { data, selectedAction, actions } = get()
    if (!data || !selectedAction) return

    const actionMeta = actions.find(a => a.name === selectedAction)
    const color      = actionMeta?.color ?? '#888888'

    const newTeeth = data.teeth.map(t => {
      if (t.number !== toothNumber) return t
      const newFaces = { ...t.faces }

      // Si la cara ya tiene esta acción → limpiar (toggle)
      if (newFaces[face]?.action === selectedAction) {
        delete newFaces[face]
      } else {
        newFaces[face] = { action: selectedAction, color }
      }
      return { ...t, faces: newFaces }
    })

    set({ data: { teeth: newTeeth }, dirty: true })
  },

  // ── Marcar diente como ausente ────────────────────────────
  toggleAbsent: (toothNumber) => {
    const { data } = get()
    if (!data) return
    const newTeeth = data.teeth.map(t =>
      t.number === toothNumber
        ? { ...t, absent: !t.absent, faces: {} }
        : t
    )
    set({ data: { teeth: newTeeth }, dirty: true })
  },

  // ── Limpiar un diente completo ────────────────────────────
  clearTooth: (toothNumber) => {
    const { data } = get()
    if (!data) return
    const newTeeth = data.teeth.map(t =>
      t.number === toothNumber ? emptyTooth(toothNumber) : t
    )
    set({ data: { teeth: newTeeth }, dirty: true })
  },

  // ── Agregar nota a un diente ──────────────────────────────
  setToothNote: (toothNumber, notes) => {
    const { data } = get()
    if (!data) return
    const newTeeth = data.teeth.map(t =>
      t.number === toothNumber ? { ...t, notes } : t
    )
    set({ data: { teeth: newTeeth }, dirty: true })
  },

  // ── Guardar en Supabase ───────────────────────────────────
  saveOdontogram: async (patientId, updatedBy) => {
    const { data, odontogramId } = get()
    if (!data) return { error: 'No hay datos para guardar' }

    set({ saving: true, error: null })

    const payload = {
      patient_id: patientId,
      data,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    }

    let error
    if (odontogramId) {
      const res = await supabase
        .from('odontograms')
        .update(payload)
        .eq('id', odontogramId)
      error = res.error
    } else {
      const res = await supabase
        .from('odontograms')
        .insert(payload)
        .select('id')
        .single()
      error = res.error
      if (!error && res.data) set({ odontogramId: res.data.id })
    }

    set({ saving: false, dirty: !error ? false : true })
    return { error: error?.message ?? null }
  },

  reset: () => set({
    data: null, odontogramId: null,
    selectedTooth: null, selectedAction: null,
    dirty: false, error: null,
  }),
}))