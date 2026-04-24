import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const useDashboardStore = create((set) => ({
  kpis: null,
  monthly: [],
  topTreatments: [],
  topDoctors: [],
  recentAppointments: [],
  loading: false,
  error: null,

  fetchDashboard: async ({ dateFrom, dateTo } = {}) => {
    set({ loading: true, error: null })

    try {
      // Rango por defecto: últimos 30 días
      const to   = dateTo   ? new Date(dateTo)   : new Date()
      const from = dateFrom ? new Date(dateFrom) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
      to.setHours(23, 59, 59)

      const isoFrom = from.toISOString()
      const isoTo   = to.toISOString()

      // ── Queries en paralelo ──────────────────────────────
      const [apptRes, monthlyRes, recentRes] = await Promise.all([

        // KPIs del período
        supabase
          .from('appointments_full')
          .select('id, status, total, paid, balance, patient_id, treatment_name, doctor_name')
          .gte('date', isoFrom)
          .lte('date', isoTo),

        // Tendencia mensual (últimos 12 meses)
        supabase
          .from('payments_monthly')
          .select('*')
          .gte('month', new Date(to.getFullYear() - 1, to.getMonth(), 1).toISOString())
          .order('month'),

        // Últimas 8 citas
        supabase
          .from('appointments_full')
          .select('*')
          .order('date', { ascending: false })
          .limit(8),
      ])

      const appts = apptRes.data ?? []

      // ── KPIs calculados ─────────────────────────────────
      const totalAppts     = appts.length
      const attended       = appts.filter(a => a.status === 'atendido').length
      const pending        = appts.filter(a => a.status === 'pendiente').length
      const cancelled      = appts.filter(a => a.status === 'cancelado').length
      const grossRevenue   = appts.reduce((s, a) => s + Number(a.total),   0)
      const collected      = appts.reduce((s, a) => s + Number(a.paid),    0)
      const pendingBalance = appts.reduce((s, a) => s + Number(a.balance), 0)
      const uniquePatients = new Set(appts.map(a => a.patient_id)).size

      // ── Top tratamientos ─────────────────────────────────
      const treatMap = {}
      appts.forEach(a => {
        if (!a.treatment_name) return
        treatMap[a.treatment_name] = (treatMap[a.treatment_name] ?? 0) + 1
      })
      const topTreatments = Object.entries(treatMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      // ── Top doctores ─────────────────────────────────────
      const docMap = {}
      appts.forEach(a => {
        if (!a.doctor_name) return
        docMap[a.doctor_name] = (docMap[a.doctor_name] ?? 0) + 1
      })
      const topDoctors = Object.entries(docMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      set({
        kpis: {
          totalAppts, attended, pending, cancelled,
          grossRevenue, collected, pendingBalance, uniquePatients,
          attendanceRate: totalAppts > 0 ? Math.round((attended / totalAppts) * 100) : 0,
        },
        monthly:            monthlyRes.data ?? [],
        topTreatments,
        topDoctors,
        recentAppointments: recentRes.data ?? [],
        loading: false,
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))