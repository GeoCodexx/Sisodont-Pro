import { useState } from 'react'
import {
  Box, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useCatalogStore } from '../../stores/useCatalogStore'

const EMPTY = { name: '', color: '#534AB7' }

export default function SpecialtiesTab({ onNotify }) {
  const { specialties, saving, createSpecialty, updateSpecialty, deleteSpecialty } = useCatalogStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const openCreate = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit   = (s)  => { setForm({ name: s.name, color: s.color }); setEditId(s.id); setOpen(true) }

  const handleSave = async () => {
    const fn  = editId ? updateSpecialty(editId, form) : createSpecialty(form)
    const { error } = await fn
    if (error) { onNotify(error, 'error'); return }
    onNotify(editId ? 'Especialidad actualizada.' : 'Especialidad creada.')
    setOpen(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar esta especialidad?')) return
    const { error } = await deleteSpecialty(id)
    if (error) onNotify(error, 'error')
    else onNotify('Especialidad desactivada.')
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva especialidad
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {specialties.map(s => (
              <TableRow key={s.id} hover>
                <TableCell>{s.name}</TableCell>
                <TableCell>
                  <Chip
                    label={s.color}
                    size="small"
                    sx={{ bgcolor: s.color, color: '#fff', fontFamily: 'monospace' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => openEdit(s)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Desactivar">
                    <IconButton size="small" onClick={() => handleDelete(s.id)}>
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
        <DialogTitle>{editId ? 'Editar especialidad' : 'Nueva especialidad'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Nombre" value={form.name} onChange={set('name')} size="small" fullWidth />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField label="Color" value={form.color} onChange={set('color')} size="small" sx={{ flex: 1 }} />
            <input type="color" value={form.color} onChange={set('color')} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
          </Box>
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