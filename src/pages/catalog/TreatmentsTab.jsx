import { useState } from "react";
import {
  Box,
  Button,
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
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Chip,
  Typography,
  InputAdornment,
  Card,
  CardContent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const EMPTY = {
  name: "",
  specialty_id: "",
  price: "",
  duration_min: 30,
  description: "",
};

function TreatmentCard({ t, onEdit, onDelete }) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 0.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {t.name}
            </Typography>
            {t.description && (
              <Typography
                variant="caption"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  color: "text.secondary",
                }}
              >
                {t.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
            <IconButton size="small" onClick={() => onEdit(t)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(t.id)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            mt: 1,
            alignItems: "center",
          }}
        >
          {t.specialty && (
            <Chip
              label={t.specialty.name}
              size="small"
              sx={{
                bgcolor: t.specialty.color + "22",
                color: t.specialty.color,
                borderColor: t.specialty.color,
              }}
              variant="outlined"
            />
          )}
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: "success.main" }}
          >
            S/ {Number(t.price).toFixed(2)}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t.duration_min} min
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function TreatmentsTab({ onNotify }) {
  const { isMobile } = useBreakpoint();
  const {
    treatments,
    specialties,
    saving,
    createTreatment,
    updateTreatment,
    deleteTreatment,
  } = useCatalogStore();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const openCreate = () => {
    setForm(EMPTY);
    setEditId(null);
    setOpen(true);
  };
  const openEdit = (t) => {
    setForm({
      name: t.name,
      specialty_id: t.specialty_id ?? "",
      price: t.price,
      duration_min: t.duration_min,
      description: t.description ?? "",
    });
    setEditId(t.id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      onNotify("El nombre es obligatorio.", "error");
      return;
    }
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      specialty_id: form.specialty_id || null,
    };
    const fn = editId
      ? updateTreatment(editId, payload)
      : createTreatment(payload);
    const { error } = await fn;
    if (error) {
      onNotify(error, "error");
      return;
    }
    onNotify(editId ? "Tratamiento actualizado." : "Tratamiento creado.");
    setOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Desactivar este tratamiento?")) return;
    const { error } = await deleteTreatment(id);
    if (error) onNotify(error, "error");
    else onNotify("Tratamiento desactivado.");
  };

  const visible = treatments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          gap: 1,
        }}
      >
        <TextField
          placeholder="Buscar tratamiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, maxWidth: { sm: 260 } }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          size={isMobile ? "small" : "medium"}
        >
          {isMobile ? "Nuevo" : "Nuevo tratamiento"}
        </Button>
      </Box>

      {/* Vista móvil */}
      {isMobile ? (
        <Box>
          {visible.length === 0 ? (
            <Typography
              sx={{ color: "text.secondary", textAlign: "center", mt: 4 }}
            >
              No se encontraron tratamientos
            </Typography>
          ) : (
            visible.map((t) => (
              <TreatmentCard
                key={t.id}
                t={t}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </Box>
      ) : (
        /* Vista desktop */
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tratamiento</TableCell>
                <TableCell>Especialidad</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No se encontraron tratamientos
                  </TableCell>
                </TableRow>
              )}
              {visible.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {t.name}
                    </Typography>
                    {t.description && (
                      <Typography variant="caption" color="text.secondary">
                        {t.description.length > 60
                          ? t.description.slice(0, 60) + "…"
                          : t.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {t.specialty ? (
                      <Chip
                        label={t.specialty.name}
                        size="small"
                        sx={{
                          bgcolor: t.specialty.color + "22",
                          color: t.specialty.color,
                          borderColor: t.specialty.color,
                        }}
                        variant="outlined"
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      S/ {Number(t.price).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {t.duration_min} min
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Desactivar">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(t.id)}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editId ? "Editar tratamiento" : "Nuevo tratamiento"}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Nombre *"
                value={form.name}
                onChange={set("name")}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                label="Especialidad"
                value={form.specialty_id}
                onChange={set("specialty_id")}
                size="small"
                fullWidth
              >
                <MenuItem value="">Sin especialidad</MenuItem>
                {specialties.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Precio"
                type="number"
                value={form.price}
                onChange={set("price")}
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">S/</InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Duración"
                type="number"
                value={form.duration_min}
                onChange={set("duration_min")}
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">min</InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Descripción"
                value={form.description}
                onChange={set("description")}
                size="small"
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
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
