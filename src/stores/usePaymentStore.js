import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const usePaymentStore = create((set, get) => ({
  rows:    [],       // payments_summary rows
  detail:  [],       // pagos individuales de una cita
  loading: false,
  saving:  false,
  error:   null,

  // Filtros activos
  filters: {
    status:    'all',   // 'all' | 'pendiente' | 'atendido' | 'cancelado'
    balance:   'all',   // 'all' | 'pending' | 'paid'
    search:    '',
    dateFrom:  '',
    dateTo:    '',
  },
  setFilter: (key, val) =>
    set(s => ({ filters: { ...s.filters, [key]: val } })),

  // ── Listado con filtros ───────────────────────────────────
  fetchPayments: async () => {
    set({ loading: true, error: null })
    const { filters } = get()

    let query = supabase
      .from('payments_summary')
      .select('*')
      .order('date', { ascending: false })

    if (filters.status !== 'all')
      query = query.eq('status', filters.status)

    if (filters.balance === 'pending')
      query = query.gt('balance', 0)
    else if (filters.balance === 'paid')
      query = query.eq('balance', 0)

    if (filters.search.trim())
      query = query.or(
        `patient_name.ilike.%${filters.search}%,patient_dni.ilike.%${filters.search}%`
      )

    if (filters.dateFrom)
      query = query.gte('date', new Date(filters.dateFrom).toISOString())

    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      to.setHours(23, 59, 59)
      query = query.lte('date', to.toISOString())
    }

    const { data, error } = await query
    if (error) set({ error: error.message })
    else set({ rows: data })
    set({ loading: false })
  },

  // ── Detalle de pagos de una cita ─────────────────────────
  fetchPaymentDetail: async (appointmentId) => {
    const { data } = await supabase
      .from('payments')
      .select('*, created_by_profile:profiles(full_name)')
      .eq('appointment_id', appointmentId)
      .order('created_at')
    set({ detail: data ?? [] })
  },

  // ── Registrar pago ────────────────────────────────────────
  registerPayment: async ({ appointmentId, amount, method, notes, createdBy }) => {
    set({ saving: true, error: null })

    // 1. Insertar en payments
    const { error: payErr } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        amount,
        method,
        notes:      notes || null,
        created_by: createdBy,
      })

    if (payErr) {
      set({ saving: false, error: payErr.message })
      return { error: payErr.message }
    }

    // 2. Actualizar paid en appointments
    const { data: appt } = await supabase
      .from('appointments')
      .select('paid')
      .eq('id', appointmentId)
      .single()

    const newPaid = (appt?.paid ?? 0) + amount
    await supabase
      .from('appointments')
      .update({ paid: newPaid })
      .eq('id', appointmentId)

    set({ saving: false })
    await get().fetchPayments()
    return { error: null }
  },

  // ── Eliminar pago (solo ADMIN) ────────────────────────────
  deletePayment: async (paymentId, appointmentId, amount) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)

    if (error) return { error: error.message }

    // Restar del paid en appointments
    const { data: appt } = await supabase
      .from('appointments')
      .select('paid')
      .eq('id', appointmentId)
      .single()

    const newPaid = Math.max(0, (appt?.paid ?? 0) - amount)
    await supabase
      .from('appointments')
      .update({ paid: newPaid })
      .eq('id', appointmentId)

    await get().fetchPayments()
    await get().fetchPaymentDetail(appointmentId)
    return { error: null }
  },
}))