import { useEffect, useState } from 'react'
import {
  Box, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
} from '@mui/material'
import { useAppointmentStore } from '../../stores/useAppointmentStore'

const STATUS_COLOR = { pendiente: 'warning', atendido: 'success', cancelado: 'error' }

export default function PatientHistory({ patientId }) {
  const { fetchByPatient } = useAppointmentStore()
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchByPatient(patientId).then(data => {
      setRows(data)
      setLoading(false)
    })
  }, [patientId])

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    : '—'

  if (loading) return <CircularProgress size={20} />

  return (
    <Box>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Este paciente no tiene citas registradas.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tratamiento</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Pagado</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>{fmt(a.date)}</TableCell>
                  <TableCell>{a.treatment_name ?? '—'}</TableCell>
                  <TableCell>{a.doctor_name ?? '—'}</TableCell>
                  <TableCell>S/ {Number(a.total).toFixed(2)}</TableCell>
                  <TableCell>S/ {Number(a.paid).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={a.status}
                      color={STATUS_COLOR[a.status] ?? 'default'}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}