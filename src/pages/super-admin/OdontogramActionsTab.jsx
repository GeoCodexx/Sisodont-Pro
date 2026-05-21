import { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useCatalogStore } from "../../stores/useCatalogStore";

const EMPTY = { name: "", color: "#534AB7", description: "" };

export default function OdontogramActionsTab({ onNotify }) {
  const {
    odontogramActions,
    saving,
    fetchOdontogramActions,
    createOdontogramAction,
    updateOdontogramAction,
    deleteOdontogramAction,
  } = useCatalogStore();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchOdontogramActions();
  }, []);

  const setField = (f) => (e) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const openCreate = () => {
    setForm(EMPTY);
    setEditId(null);
    setOpen(true);
  };
  const openEdit = (a) => {
    setForm({ name: a.name, color: a.color, description: a.description ?? "" });
    setEditId(a.id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      onNotify("El nombre es requerido.", "error");
      return;
    }
    const fn = editId
      ? updateOdontogramAction(editId, form)
      : createOdontogramAction(form);
    const { error } = await fn;
    if (error) {
      onNotify(error, "error");
      return;
    }
    onNotify(editId ? "Acción actualizada." : "Acción creada.");
    setOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Desactivar esta acción?")) return;
    const { error } = await deleteOdontogramAction(id);
    if (error) onNotify(error, "error");
    else onNotify("Acción desactivada.");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Nueva acción
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {odontogramActions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  sx={{ py: 4, color: "text.secondary" }}
                >
                  No hay acciones registradas
                </TableCell>
              </TableRow>
            )}
            {odontogramActions.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: a.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {a.name}
                    </Typography>
                    {!a.active && (
                      <Chip
                        label="Inactiva"
                        size="small"
                        sx={{ height: 16, fontSize: 10 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={a.color}
                    size="small"
                    sx={{
                      bgcolor: a.color,
                      color: "#fff",
                      fontFamily: "monospace",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {a.description || "—"}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => openEdit(a)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Desactivar">
                    <IconButton size="small" onClick={() => handleDelete(a.id)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{editId ? "Editar acción" : "Nueva acción"}</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: "16px !important",
          }}
        >
          <TextField
            label="Nombre *"
            value={form.name}
            onChange={setField("name")}
            size="small"
            fullWidth
            placeholder="Ej: Caries, Corona, Extracción"
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              label="Color"
              value={form.color}
              onChange={setField("color")}
              size="small"
              sx={{ flex: 1 }}
            />
            <input
              type="color"
              value={form.color}
              onChange={setField("color")}
              style={{
                width: 40,
                height: 36,
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
              }}
            />
          </Box>
          <TextField
            label="Descripción"
            value={form.description}
            onChange={setField("description")}
            size="small"
            fullWidth
            multiline
            rows={2}
            placeholder="Descripción opcional..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
