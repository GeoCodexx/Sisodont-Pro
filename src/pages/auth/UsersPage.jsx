import { useEffect, useState } from 'react'
import {
  Box, Typography, Button, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, Tooltip, Avatar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useUsersStore } from '../../stores/useUsersStore'

const ROLES = ['ADMIN', 'DOCTOR', 'ASSISTANT', 'PATIENT']

const ROLE_COLORS = {
  ADMIN:     'error',
  DOCTOR:    'primary',
  ASSISTANT: 'warning',
  PATIENT:   'default',
}

const ROLE_LABELS = {
  ADMIN:     'Administrador',
  DOCTOR:    'Doctor',
  ASSISTANT: 'Asistente',
  PATIENT:   'Paciente',
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function UsersPage() {
  const { users, loading, fetchUsers, updateRole, toggleActive, inviteUser } = useUsersStore()

  const [openInvite, setOpenInvite] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selected, setSelected] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const [invite, setInvite] = useState({ email: '', full_name: '', role: 'PATIENT', password: '' })
  const setInviteField = (f) => (e) => setInvite(p => ({ ...p, [f]: e.target.value }))

  useEffect(() => { fetchUsers() }, [])

  const handleInvite = async () => {
    setActionError('')
    const { error } = await inviteUser(invite)
    if (error) { setActionError(error); return }
    setActionSuccess('Usuario creado correctamente.')
    setOpenInvite(false)
    setInvite({ email: '', full_name: '', role: 'PATIENT', password: '' })
  }

  const handleRoleChange = async (userId, role) => {
    const { error } = await updateRole(userId, role)
    if (error) setActionError(error)
    else setActionSuccess('Rol actualizado.')
    setOpenEdit(false)
  }

  const handleToggle = async (user) => {
    const { error } = await toggleActive(user.id, user.active)
    if (error) setActionError(error)
    else setActionSuccess(user.active ? 'Usuario desactivado.' : 'Usuario activado.')
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={500}>Gestión de usuarios</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setOpenInvite(true); setActionError('') }}
        >
          Nuevo usuario
        </Button>
      </Box>

      {actionError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}
      {actionSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess('')}>{actionSuccess}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Registrado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
                        {initials(u.full_name)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>{u.full_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ROLE_LABELS[u.role] ?? u.role}
                      color={ROLE_COLORS[u.role] ?? 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.active ? 'Activo' : 'Inactivo'}
                      color={u.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(u.created_at).toLocaleDateString('es-PE')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar rol">
                      <IconButton size="small" onClick={() => { setSelected(u); setOpenEdit(true) }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={u.active ? 'Desactivar' : 'Activar'}>
                      <IconButton size="small" onClick={() => handleToggle(u)}>
                        {u.active
                          ? <BlockIcon fontSize="small" color="error" />
                          : <CheckCircleIcon fontSize="small" color="success" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal: nuevo usuario */}
      <Dialog open={openInvite} onClose={() => setOpenInvite(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo usuario</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {actionError && <Alert severity="error">{actionError}</Alert>}
          <TextField label="Nombre completo" value={invite.full_name} onChange={setInviteField('full_name')} size="small" fullWidth />
          <TextField label="Correo electrónico" type="email" value={invite.email} onChange={setInviteField('email')} size="small" fullWidth />
          <TextField label="Contraseña temporal" type="password" value={invite.password} onChange={setInviteField('password')} size="small" fullWidth />
          <TextField select label="Rol" value={invite.role} onChange={setInviteField('role')} size="small" fullWidth>
            {ROLES.map(r => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenInvite(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleInvite}>Crear usuario</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: editar rol */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar rol — {selected?.full_name}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            select label="Rol" defaultValue={selected?.role ?? 'PATIENT'}
            onChange={(e) => handleRoleChange(selected.id, e.target.value)}
            size="small" fullWidth
          >
            {ROLES.map(r => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEdit(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}