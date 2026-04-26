import { supabase } from '../services/supabaseClient'
import {
  exportToExcel, exportToPDF,
  fmtDate, fmtBool,
} from '../services/exportService'

const COLUMNS = [
  { header: 'Nombre completo',  key: 'full_name',    width: 28 },
  { header: 'DNI',              key: 'dni',           width: 12 },
  { header: 'Género',           key: 'gender_label',  width: 12 },
  { header: 'Fecha nacimiento', key: 'birth_date_fmt',width: 18 },
  { header: 'Teléfono',         key: 'phone',         width: 15 },
  { header: 'Correo',           key: 'email',         width: 28 },
  { header: 'Dirección',        key: 'address',       width: 32 },
  { header: 'Diabetes',         key: 'diabetes_label',width: 10 },
  { header: 'Hipertensión',     key: 'hyp_label',     width: 12 },
  { header: 'Gestante',         key: 'preg_label',    width: 10 },
  { header: 'Alergias',         key: 'allergies',     width: 24 },
  { header: 'Diagnóstico',      key: 'diagnosis',     width: 30 },
  { header: 'Observaciones',    key: 'observations',  width: 30 },
]

const GENDER_LABEL = { M: 'Masculino', F: 'Femenino', otro: 'Otro' }

function normalize(patients) {
  return patients.map(p => ({
    ...p,
    gender_label:   GENDER_LABEL[p.gender] ?? '—',
    birth_date_fmt: fmtDate(p.birth_date),
    diabetes_label: fmtBool(p.diabetes),
    hyp_label:      fmtBool(p.hypertension),
    preg_label:     fmtBool(p.pregnancy),
    allergies:      p.allergies    ?? '—',
    diagnosis:      p.diagnosis    ?? '—',
    observations:   p.observations ?? '—',
    phone:          p.phone        ?? '—',
    email:          p.email        ?? '—',
    address:        p.address      ?? '—',
    dni:            p.dni          ?? '—',
  }))
}

// Fetch completo (sin paginación) respetando el filtro de búsqueda activo
async function fetchAllPatients(search = '') {
  let query = supabase
    .from('patients')
    .select('*')
    .eq('active', true)
    .order('full_name')

  if (search.trim()) {
    query = query.or(`full_name.ilike.%${search}%,dni.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return normalize(data ?? [])
}

export function usePatientsExport(search = '') {
  const subtitle = search ? `Búsqueda: "${search}"` : 'Todos los pacientes activos'

  const handleExcel = async () => {
    const rows = await fetchAllPatients(search)
    exportToExcel({
      rows,
      columns:   COLUMNS,
      filename:  'pacientes_' + new Date().toISOString().slice(0, 10),
      sheetName: 'Pacientes',
    })
  }

  const handlePdf = async () => {
    const rows = await fetchAllPatients(search)
    exportToPDF({
      rows,
      columns:  COLUMNS,
      filename: 'pacientes_' + new Date().toISOString().slice(0, 10),
      title:    'Listado de Pacientes',
      subtitle,
    })
  }

  return { handleExcel, handlePdf }
}