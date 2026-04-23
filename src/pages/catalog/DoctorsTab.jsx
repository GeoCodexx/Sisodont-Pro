import { useState } from 'react'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Avatar, Typography, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useCatalogStore } from '../../stores/useCatalogStore'
import { useUsersStore } from '../../stores/useUsersStore'
import { useEffect } from 'react'

const EMPTY = { profile_id: '', specialty_id: '', license: '' }

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function DoctorsTab({ onNotify }) {
  const { doctors, specialties, saving, createDoctor, updateDoctor, deleteDoctor } = useCatalogStore()
  const { users, fetchUsers } = useUsersStore()

  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState(EMPTY)
  const [editId, setEditId] = useState(null)

  // Solo perfiles con rol DOCTOR disponibles para asignar
  const doctorProfiles = users.filter(u =>
    u.role === 'DOCTOR' && !doctors.some(d => d.profile_id === u.id && d.id !== editId)
  )

  useEffect(() => { fetchUsers() }, [])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const openCreate = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit   = (d) => {
    setForm({ profile_id: d.profile_id, specialty_id: d.specialty_id ?? '', license: d.license ?? '' })
    setEditId(d.id)
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.profile_id) { onNotify('Selecciona un perfil de doctor.', 'error'); return }
    const fn = editId
      ? updateDoctor(editId, { specialty_id: form.specialty_id || null, license: form.license })
      : createDoctor(form)
    const { error } = await fn
    if (error) { onNotify(error, 'error'); return }
    onNotify(editId ? 'Doctor actualizado.' : 'Doctor registrado.')
    setOpen(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este doctor?')) return
    const { error } = await deleteDoctor(id)
    if (error) onNotify(error, 'error')
    else onNotify('Doctor desactivado.')
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Registrar doctor
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Doctor</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>N.° colegiatura</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay doctores registrados
                </TableCell>
              </TableRow>
            )}
            {doctors.map(d => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
                      {initials(d.profile?.full_name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {d.profile?.full_name ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.profile?.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  {d.specialty ? (
                    <Chip
                      label={d.specialty.name}
                      size="small"
                      sx={{ bgcolor: d.specialty.color + '22', color: d.specialty.color, borderColor: d.specialty.color }}
                      variant="outlined"
                    />
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{d.license ?? '—'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => openEdit(d)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Desactivar">
                    <IconButton size="small" onClick={() => handleDelete(d.id)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Editar doctor' : 'Registrar doctor'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {!editId && (
            <TextField select label="Perfil de usuario (rol DOCTOR)" value={form.profile_id} onChange={set('profile_id')} size="small" fullWidth>
              {doctorProfiles.length === 0 && (
                <MenuItem disabled>No hay usuarios con rol DOCTOR disponibles</MenuItem>
              )}
              {doctorProfiles.map(u => (
                <MenuItem key={u.id} value={u.id}>{u.full_name} — {u.email}</MenuItem>
              ))}
            </TextField>
          )}
          <TextField select label="Especialidad" value={form.specialty_id} onChange={set('specialty_id')} size="small" fullWidth>
            <MenuItem value="">Sin especialidad</MenuItem>
            {specialties.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="N.° de colegiatura" value={form.license} onChange={set('license')} size="small" fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}