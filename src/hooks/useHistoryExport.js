import { supabase } from '../services/supabaseClient'
import {
  exportToExcel, exportToPDF,
  fmtDateTime, fmtSoles, fmtDate,
} from '../services/exportService'

const COLUMNS = [
  { header: 'Fecha',         key: 'date_fmt',       width: 18 },
  { header: 'Paciente',      key: 'patient_name',   width: 28 },
  { header: 'DNI',           key: 'patient_dni',    width: 12 },
  { header: 'Tratamiento',   key: 'treatment_name', width: 24 },
  { header: 'Especialidad',  key: 'specialty_name', width: 20 },
  { header: 'Doctor',        key: 'doctor_name',    width: 24 },
  { header: 'Total',         key: 'total_fmt',      width: 14 },
  { header: 'Pagado',        key: 'paid_fmt',       width: 14 },
  { header: 'Saldo',         key: 'balance_fmt',    width: 14 },
  { header: 'Estado',        key: 'status',         width: 14 },
  { header: 'Notas',         key: 'notes',          width: 36 },
]

function normalize(rows) {
  return rows.map(r => ({
    ...r,
    date_fmt:       fmtDateTime(r.date),
    total_fmt:      fmtSoles(r.total),
    paid_fmt:       fmtSoles(r.paid),
    balance_fmt:    fmtSoles(r.balance),
    treatment_name: r.treatment_name ?? '—',
    specialty_name: r.specialty_name ?? '—',
    doctor_name:    r.doctor_name    ?? '—',
    patient_dni:    r.patient_dni    ?? '—',
    notes:          r.notes          ?? '—',
  }))
}

async function fetchAllHistory(filters) {
  let query = supabase
    .from('appointments_full')
    .select('*')
    .order('date', { ascending: false })
    .limit(2000) // limite maximo para evitar problemas de memoria, recomendable usar filtros de fechas

  if (filters.status !== 'all')  query = query.eq('status', filters.status)
  if (filters.treatment_id)      query = query.eq('treatment_id', filters.treatment_id)
  if (filters.search?.trim())
    query = query.or(
      'patient_name.ilike.%' + filters.search + '%,' +
      'patient_dni.ilike.%'  + filters.search + '%,' +
      'doctor_name.ilike.%'  + filters.search + '%'
    )
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
  if (filters.status !== 'all') parts.push('Estado: ' + filters.status)
  if (filters.search)           parts.push('Búsqueda: "' + filters.search + '"')
  if (filters.dateFrom)         parts.push('Desde: ' + fmtDate(filters.dateFrom))
  if (filters.dateTo)           parts.push('Hasta: ' + fmtDate(filters.dateTo))
  return parts.length ? parts.join(' · ') : 'Historial completo'
}

export function useHistoryExport(filters) {
  const subtitle = buildSubtitle(filters)

  const handleExcel = async () => {
    const rows = await fetchAllHistory(filters)
    exportToExcel({
      rows,
      columns:   COLUMNS,
      filename:  'historial_' + new Date().toISOString().slice(0, 10),
      sheetName: 'Historial clínico',
    })
  }

  const handlePdf = async () => {
    const rows = await fetchAllHistory(filters)
    exportToPDF({
      rows,
      columns:  COLUMNS,
      filename: 'historial_' + new Date().toISOString().slice(0, 10),
      title:    'Historial Clínico',
      subtitle,
    })
  }

  return { handleExcel, handlePdf }
}