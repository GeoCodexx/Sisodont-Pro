import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Divider, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, MenuItem,
  InputAdornment, Alert, CircularProgress, Chip,
  IconButton, Tooltip, Badge,
} from '@mui/material'
import DeleteIcon       from '@mui/icons-material/Delete'
import FolderOpenIcon   from '@mui/icons-material/FolderOpen'
import ReceiptIcon      from '@mui/icons-material/Receipt'
import { usePaymentStore }     from '../../stores/usePaymentStore'
import { useCasePaymentStore } from '../../stores/useCasePaymentStore'
import { useAuthStore }        from '../../stores/useAuthStore'
import { useRole }             from '../../hooks/useRole'
import { supabase }            from '../../services/supabaseClient'

const METHODS = ['efectivo', 'tarjeta', 'transferencia', 'yape', 'plin']
const METHOD_COLORS = {
  efectivo:      'default',
  tarjeta:       'primary',
  transferencia: 'info',
  yape:          'secondary',
  plin:          'success',
}

const EMPTY_PAY = { amount: '', method: 'efectivo', notes: '' }

function fmtDate(iso) {
  return iso
    ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    : '—'
}

// ── Vista de pagos para CASO MULTISESIÓN ─────────────────────
function CasePaymentView({ row, onClose, onRefresh }) {
  const { payments, saving, fetchByCase, registerPayment, deletePayment } = useCasePaymentStore()
  const { profile } = useAuthStore()
  const { can }     = useRole()

  const [form,     setForm]     = useState(EMPTY_PAY)
  const [feedback, setFeedback] = useState({ msg: '', type: 'success' })
  const [sessions, setSessions] = useState([])

  const balance = Number(row.balance ?? 0)
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  useEffect(() => {
    fetchByCase(row.ref_id)
    // Cargar sesiones del caso
    supabase
      .from('appointments_full')
      .select('id, date, status, notes, treatment_name')
      .eq('case_id', row.ref_id)
      .order('date')
      .then(({ data }) => setSessions(data ?? []))
  }, [row.ref_id])

  const handleRegister = async () => {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { setFeedback({ msg: 'Monto inválido.', type: 'error' }); return }
    if (amount > balance + 0.001) { setFeedback({ msg: `Supera el saldo (S/ ${balance.toFixed(2)}).`, type: 'error' }); return }

    const { error } = await registerPayment({
      caseId:    row.ref_id,
      amount,
      method:    form.method,
      notes:     form.notes,
      createdBy: profile?.id,
    })
    if (error) setFeedback({ msg: error, type: 'error' })
    else { setFeedback({ msg: 'Pago registrado.', type: 'success' }); setForm(EMPTY_PAY); onRefresh() }
  }

  const handleDelete = async (payId) => {
    if (!window.confirm('¿Eliminar este pago?')) return
    const { error } = await deletePayment(payId, row.ref_id)
    if (error) setFeedback({ msg: error, type: 'error' })
    else { setFeedback({ msg: 'Pago eliminado.', type: 'success' }); onRefresh() }
  }

  return (
    <>
      {/* Header del caso */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FolderOpenIcon color="primary" fontSize="small" />
        <Typography variant="body2" color="primary.main" fontWeight={500}>
          Caso multisesión en curso
        </Typography>
        <Chip label={row.case_status ?? 'en_curso'} size="small"
          color={row.case_status === 'completado' ? 'success' : 'primary'}
          sx={{ textTransform: 'capitalize' }} />
      </Box>

      {/* Resumen financiero del caso */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, mb: 2 }}>
        {[
          ['Costo total pactado', `S/ ${Number(row.total).toFixed(2)}`, 'text.primary'],
          ['Total pagado',         `S/ ${Number(row.paid).toFixed(2)}`,  'success.main'],
          ['Saldo pendiente',      `S/ ${balance.toFixed(2)}`,           balance > 0 ? 'error.main' : 'text.secondary'],
        ].map(([label, value, color]) => (
          <Box key={label} sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
            <Typography variant="body2" fontWeight={600} color={color}>{value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Sesiones del caso */}
      {sessions.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.75}>
            SESIONES ({sessions.length})
          </Typography>
          <Box sx={{ mb: 2 }}>
            {sessions.map((s, i) => (
              <Box key={s.id} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                py: 0.75, borderBottom: i < sessions.length - 1 ? '0.5px solid' : 'none',
                borderColor: 'divider',
              }}>
                <Box>
                  <Typography variant="body2">Sesión {i + 1}</Typography>
                  <Typography variant="caption" color="text.secondary">{fmtDate(s.date)}</Typography>
                </Box>
                <Chip
                  label={s.status}
                  size="small"
                  color={s.status === 'atendido' ? 'success' : s.status === 'cancelado' ? 'error' : 'warning'}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
            ))}
          </Box>
        </>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Historial de pagos del caso */}
      <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.75}>
        PAGOS REGISTRADOS
      </Typography>

      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" mb={2}>
          No hay pagos registrados para este caso.
        </Typography>
      ) : (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Registrado por</TableCell>
              {can(['ADMIN']) && <TableCell align="right" />}
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map(p => (
              <TableRow key={p.id}>
                <TableCell><Typography variant="body2">{fmtDate(p.created_at)}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    S/ {Number(p.amount).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={p.method} size="small"
                    color={METHOD_COLORS[p.method] ?? 'default'} variant="outlined"
                    sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {p.created_by_profile?.full_name ?? '—'}
                  </Typography>
                </TableCell>
                {can(['ADMIN']) && (
                  <TableCell align="right">
                    <Tooltip title="Eliminar pago">
                      <IconButton size="small" onClick={() => handleDelete(p.id)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Registrar nuevo pago */}
      {can(['ADMIN', 'ASSISTANT']) && balance > 0 && (
        <>
          {feedback.msg && (
            <Alert severity={feedback.type} sx={{ mb: 1.5 }}
              onClose={() => setFeedback({ msg: '', type: 'success' })}>
              {feedback.msg}
            </Alert>
          )}
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={1}>
            REGISTRAR PAGO — Saldo: S/ {balance.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              label="Monto" type="number" value={form.amount}
              onChange={set('amount')} size="small" sx={{ width: 130 }}
              InputProps={{ startAdornment: <InputAdornment position="start">S/</InputAdornment> }}
            />
            <TextField select label="Método" value={form.method}
              onChange={set('method')} size="small" sx={{ width: 150 }}>
              {METHODS.map(m => (
                <MenuItem key={m} value={m} sx={{ textTransform: 'capitalize' }}>{m}</MenuItem>
              ))}
            </TextField>
            <TextField label="Notas" value={form.notes} onChange={set('notes')}
              size="small" sx={{ flex: 1, minWidth: 120 }} />
            <Button variant="contained" onClick={handleRegister} disabled={saving}
              sx={{ alignSelf: 'center' }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Registrar'}
            </Button>
          </Box>
        </>
      )}

      {balance <= 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1 }}>
          Este caso está completamente pagado.
        </Alert>
      )}
    </>
  )
}

// ── Vista de pagos para CITA INDIVIDUAL ──────────────────────
function AppointmentPaymentView({ row, onClose, onRefresh }) {
  const { registerAppointmentPayment, saving } = usePaymentStore()
  const { profile } = useAuthStore()
  const { can }     = useRole()

  const [apptPayments, setApptPayments] = useState([])
  const [form,         setForm]         = useState(EMPTY_PAY)
  const [feedback,     setFeedback]     = useState({ msg: '', type: 'success' })

  const balance = Number(row.balance ?? 0)
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  useEffect(() => {
    supabase
      .from('payments')
      .select('*, created_by_profile:profiles(full_name)')
      .eq('appointment_id', row.ref_id)
      .order('created_at')
      .then(({ data }) => setApptPayments(data ?? []))
  }, [row.ref_id])

  const handleRegister = async () => {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { setFeedback({ msg: 'Monto inválido.', type: 'error' }); return }
    if (amount > balance + 0.001) { setFeedback({ msg: `Supera el saldo (S/ ${balance.toFixed(2)}).`, type: 'error' }); return }

    const { error } = await registerAppointmentPayment({
      appointmentId: row.ref_id,
      amount, method: form.method, notes: form.notes,
      createdBy: profile?.id,
    })
    if (error) setFeedback({ msg: error, type: 'error' })
    else {
      setFeedback({ msg: 'Pago registrado.', type: 'success' })
      setForm(EMPTY_PAY)
      // Refrescar pagos locales
      const { data } = await supabase
        .from('payments')
        .select('*, created_by_profile:profiles(full_name)')
        .eq('appointment_id', row.ref_id)
        .order('created_at')
      setApptPayments(data ?? [])
      onRefresh()
    }
  }

  return (
    <>
      {/* Resumen financiero de la cita */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ReceiptIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Cita individual
        </Typography>
        <Chip label={row.status} size="small"
          color={row.status === 'atendido' ? 'success' : row.status === 'cancelado' ? 'error' : 'warning'}
          sx={{ textTransform: 'capitalize' }} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, mb: 2 }}>
        {[
          ['Total',   `S/ ${Number(row.total).toFixed(2)}`,   'text.primary'],
          ['Pagado',  `S/ ${Number(row.paid).toFixed(2)}`,    'success.main'],
          ['Saldo',   `S/ ${balance.toFixed(2)}`,             balance > 0 ? 'error.main' : 'text.secondary'],
        ].map(([label, value, color]) => (
          <Box key={label} sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
            <Typography variant="body2" fontWeight={600} color={color}>{value}</Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Historial */}
      <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.75}>
        PAGOS REGISTRADOS
      </Typography>
      {apptPayments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" mb={2}>Sin pagos registrados.</Typography>
      ) : (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Por</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apptPayments.map(p => (
              <TableRow key={p.id}>
                <TableCell><Typography variant="body2">{fmtDate(p.created_at)}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    S/ {Number(p.amount).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={p.method} size="small" variant="outlined"
                    sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {p.created_by_profile?.full_name ?? '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Nuevo pago */}
      {can(['ADMIN', 'ASSISTANT']) && balance > 0 && (
        <>
          {feedback.msg && (
            <Alert severity={feedback.type} sx={{ mb: 1.5 }}
              onClose={() => setFeedback({ msg: '', type: 'success' })}>
              {feedback.msg}
            </Alert>
          )}
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={1}>
            REGISTRAR PAGO — Saldo: S/ {balance.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField label="Monto" type="number" value={form.amount}
              onChange={set('amount')} size="small" sx={{ width: 130 }}
              InputProps={{ startAdornment: <InputAdornment position="start">S/</InputAdornment> }} />
            <TextField select label="Método" value={form.method}
              onChange={set('method')} size="small" sx={{ width: 150 }}>
              {METHODS.map(m => (
                <MenuItem key={m} value={m} sx={{ textTransform: 'capitalize' }}>{m}</MenuItem>
              ))}
            </TextField>
            <TextField label="Notas" value={form.notes} onChange={set('notes')}
              size="small" sx={{ flex: 1, minWidth: 120 }} />
            <Button variant="contained" onClick={handleRegister} disabled={saving}
              sx={{ alignSelf: 'center' }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Registrar'}
            </Button>
          </Box>
        </>
      )}
      {balance <= 0 && <Alert severity="success" icon={false} sx={{ mt: 1 }}>Cita completamente pagada.</Alert>}
    </>
  )
}

// ── Modal principal unificado ─────────────────────────────────
export default function PaymentDetailModal({ open, row, onClose }) {
  const { fetchPayments } = usePaymentStore()

  if (!row) return null

  const isCase = row.payment_type === 'case'

  const fmtDate2 = iso => iso
    ? new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'medium' })
    : '—'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={500}>{row.patient_name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {row.treatment_name ?? '—'} · {fmtDate2(row.date)}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isCase ? (
          <CasePaymentView row={row} onClose={onClose} onRefresh={fetchPayments} />
        ) : (
          <AppointmentPaymentView row={row} onClose={onClose} onRefresh={fetchPayments} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}