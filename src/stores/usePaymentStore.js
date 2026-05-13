import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const usePaymentStore = create((set, get) => ({
  rows:    [],
  total:   0,
  loading: false,
  saving:  false,
  error:   null,

  filters: {
    status:      'all',
    balance:     'all',
    search:      '',
    dateFrom:    '',
    dateTo:      '',
    paymentType: 'all', // 'all' | 'appointment' | 'case'
  },
  setFilter: (key, val) =>
    set(s => ({ filters: { ...s.filters, [key]: val } })),

  // ── Listado paginado server-side ──────────────────────────
  fetchPayments: async ({ page = 1, pageSize = 20 } = {}) => {
    set({ loading: true, error: null })
    const { filters } = get()

    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    let query = supabase
      .from('payments_summary')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to)

    if (filters.paymentType !== 'all')
      query = query.eq('payment_type', filters.paymentType)

    if (filters.status !== 'all')
      query = query.eq('status', filters.status)

    if (filters.balance === 'pending')
      query = query.gt('balance', 0)
    else if (filters.balance === 'paid')
      query = query.lte('balance', 0)

    if (filters.search.trim())
      query = query.or(
        `patient_name.ilike.%${filters.search}%,patient_dni.ilike.%${filters.search}%`
      )

    if (filters.dateFrom)
      query = query.gte('date', new Date(filters.dateFrom).toISOString())

    if (filters.dateTo) {
      const d = new Date(filters.dateTo)
      d.setHours(23, 59, 59)
      query = query.lte('date', d.toISOString())
    }

    const { data, error, count } = await query
    if (error) set({ error: error.message })
    else set({ rows: data ?? [], total: count ?? 0 })
    set({ loading: false })
  },

  // ── Pago en cita individual (sesión única) ────────────────
  registerAppointmentPayment: async ({
    appointmentId, amount, method, notes, createdBy,
  }) => {
    set({ saving: true, error: null })

    const { error: payErr } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        amount,
        method,
        notes:      notes || null,
        created_by: createdBy,
      })

    if (payErr) { set({ saving: false }); return { error: payErr.message } }

    const { data: appt } = await supabase
      .from('appointments')
      .select('paid')
      .eq('id', appointmentId)
      .single()

    await supabase
      .from('appointments')
      .update({ paid: (appt?.paid ?? 0) + amount })
      .eq('id', appointmentId)

    set({ saving: false })
    return { error: null }
  },
}))