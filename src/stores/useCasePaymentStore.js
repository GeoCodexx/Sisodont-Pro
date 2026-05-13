import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const useCasePaymentStore = create((set, get) => ({
  payments: [],
  loading:  false,
  saving:   false,
  error:    null,

  // ── Historial de pagos de un caso ─────────────────────────
  fetchByCase: async (caseId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('case_payments')
      .select('*, created_by_profile:profiles(full_name)')
      .eq('case_id', caseId)
      .order('created_at')

    if (error) set({ error: error.message })
    else set({ payments: data ?? [] })
    set({ loading: false })
  },

  // ── Registrar pago ────────────────────────────────────────
  registerPayment: async ({ caseId, amount, method, notes, createdBy }) => {
    set({ saving: true, error: null })

    const { error } = await supabase
      .from('case_payments')
      .insert({
        case_id:    caseId,
        amount,
        method,
        notes:      notes || null,
        created_by: createdBy,
      })

    set({ saving: false })
    if (error) { set({ error: error.message }); return { error: error.message } }

    // Refrescar historial
    await get().fetchByCase(caseId)
    return { error: null }
  },

  // ── Eliminar pago (solo ADMIN) ────────────────────────────
  deletePayment: async (paymentId, caseId) => {
    const { error } = await supabase
      .from('case_payments')
      .delete()
      .eq('id', paymentId)

    if (error) return { error: error.message }
    await get().fetchByCase(caseId)
    return { error: null }
  },

  clearPayments: () => set({ payments: [] }),
}))