import { useNavigate } from 'react-router-dom'
import {
  Card, CardContent, Typography, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, Button,
} from '@mui/material'

const STATUS_COLOR = { pendiente: 'warning', atendido: 'success', cancelado: 'error' }

export default function RecentAppointmentsCard({ rows }) {
  const navigate = useNavigate()

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    : '—'

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" fontWeight={500} mb={2}>
          Últimas citas
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Tratamiento</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No hay citas registradas aún
                </TableCell>
              </TableRow>
            )}
            {rows.map(a => (
              <TableRow key={a.id} hover sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/patients/${a.patient_id}`)}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{a.patient_name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{a.treatment_name ?? '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{a.doctor_name ?? '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{fmt(a.date)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">S/ {Number(a.total).toFixed(2)}</Typography>
                </TableCell>
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
        {rows.length > 0 && (
          <Button size="small" sx={{ mt: 1.5 }} onClick={() => navigate('/history')}>
            Ver historial completo →
          </Button>
        )}
      </CardContent>
    </Card>
  )
}