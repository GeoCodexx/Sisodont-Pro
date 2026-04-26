import { supabase } from '../services/supabaseClient'
import {
  exportToExcel, exportToPDF,
  fmtDate, fmtSoles,
} from '../services/exportService'

const COLUMNS = [
  { header: 'Fecha',         key: 'date_fmt',       width: 16 },
  { header: 'Paciente',      key: 'patient_name',   width: 28 },
  { header: 'DNI',           key: 'patient_dni',    width: 12 },
  { header: 'Tratamiento',   key: 'treatment_name', width: 24 },
  { header: 'Doctor',        key: 'doctor_name',    width: 24 },
  { header: 'Especialidad',  key: 'specialty_name', width: 20 },
  { header: 'Total',         key: 'total_fmt',      width: 14 },
  { header: 'Pagado',        key: 'paid_fmt',       width: 14 },
  { header: 'Saldo',         key: 'balance_fmt',    width: 14 },
  { header: 'Estado',        key: 'status',         width: 14 },
]

function normalize(rows) {
  return rows.map(r => ({
    ...r,
    date_fmt:       fmtDate(r.date),
    total_fmt:      fmtSoles(r.total),
    paid_fmt:       fmtSoles(r.paid),
    balance_fmt:    fmtSoles(r.balance),
    treatment_name: r.treatment_name ?? '—',
    doctor_name:    r.doctor_name    ?? '—',
    specialty_name: r.specialty_name ?? '—',
    patient_dni:    r.patient_dni    ?? '—',
  }))
}

async function fetchAllPayments(filters) {
  let query = supabase
    .from('payments_summary')
    .select('*')
    .order('date', { ascending: false })

  if (filters.status !== 'all')  query = query.eq('status', filters.status)
  if (filters.balance === 'pending') query = query.gt('balance', 0)
  else if (filters.balance === 'paid') query = query.eq('balance', 0)
  if (filters.search?.trim())
    query = query.or(`patient_name.ilike.%${filters.search}%,patient_dni.ilike.%${filters.search}%`)
  if (filters.dateFrom) query = query.gte('date', new Date(filters.dateFrom).toISOString())
  if (filters.dateTo) {
    const d = new Date(filters.dateTo); d.setHours(23, 59, 59)
    query = query.lte('date', d.toISOString())
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return normalize(data ?? [])
}

function buildSubtitle(filters) {
  const parts = []
  if (filters.status !== 'all')        parts.push('Estado: ' + filters.status)
  if (filters.balance === 'pending')   parts.push('Con deuda')
  if (filters.balance === 'paid')      parts.push('Pagado')
  if (filters.search)                  parts.push('Búsqueda: "' + filters.search + '"')
  if (filters.dateFrom)                parts.push('Desde: ' + fmtDate(filters.dateFrom))
  if (filters.dateTo)                  parts.push('Hasta: ' + fmtDate(filters.dateTo))
  return parts.length ? parts.join(' · ') : 'Todos los pagos'
}

export function usePaymentsExport(filters) {
  const subtitle = buildSubtitle(filters)

  const handleExcel = async () => {
    const rows = await fetchAllPayments(filters)
    exportToExcel({
      rows,
      columns:   COLUMNS,
      filename:  'pagos_' + new Date().toISOString().slice(0, 10),
      sheetName: 'Pagos',
    })
  }

  const handlePdf = async () => {
    const rows = await fetchAllPayments(filters)
    exportToPDF({
      rows,
      columns:  COLUMNS,
      filename: 'pagos_' + new Date().toISOString().slice(0, 10),
      title:    'Reporte de Pagos',
      subtitle,
    })
  }

  return { handleExcel, handlePdf }
}