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
  FormControlLabel,
  Switch,
  Collapse,
  Alert,
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
  is_multisession: false,
  unit_price: "",
};

function TreatmentTypeChip({ isMultisession, unitPrice }) {
  if (isMultisession)
    return (
      <Chip
        label="Multisesión"
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontSize: 10, height: 20 }}
      />
    );
  if (unitPrice)
    return (
      <Chip
        label="Por unidad"
        size="small"
        color="warning"
        variant="outlined"
        sx={{ fontSize: 10, height: 20 }}
      />
    );
  return (
    <Chip
      label="Sesión única"
      size="small"
      variant="outlined"
      sx={{ fontSize: 10, height: 20 }}
    />
  );
}

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
            <Typography variant="body2" fontWeight={500} noWrap>
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
          <Box sx={{ display: "flex", gap: 0.5, ml: 1, flexShrink: 0 }}>
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
          <TreatmentTypeChip
            isMultisession={t.is_multisession}
            unitPrice={t.unit_price}
          />
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{
              color: t.is_multisession
                ? "text.secondary"
                : t.unit_price
                  ? "warning.dark"
                  : "success.main",
            }}
          >
            {t.unit_price
              ? `S/ ${Number(t.unit_price).toFixed(2)}/unidad`
              : t.is_multisession
                ? "Pactado por caso"
                : `S/ ${Number(t.price).toFixed(2)}`}
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

  const set = (f) => (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [f]: val }));
  };

  const openCreate = () => {
    setForm(EMPTY);
    setEditId(null);
    setOpen(true);
  };
  const openEdit = (t) => {
    setForm({
      name: t.name,
      specialty_id: t.specialty_id ?? "",
      price: t.price ?? "",
      duration_min: t.duration_min ?? 30,
      description: t.description ?? "",
      is_multisession: t.is_multisession ?? false,
      unit_price: t.unit_price ?? "",
    });
    setEditId(t.id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      onNotify("El nombre es obligatorio.", "error");
      return;
    }
    if (
      !form.is_multisession &&
      !form.unit_price &&
      (form.price === "" || Number(form.price) < 0)
    ) {
      onNotify("Ingresa un precio válido.", "error");
      return;
    }

    const payload = {
      name: form.name.trim(),
      specialty_id: form.specialty_id || null,
      duration_min: parseInt(form.duration_min) || 30,
      description: form.description || null,
      is_multisession: form.is_multisession,
      price: form.unit_price ? 0 : parseFloat(form.price) || 0,
      unit_price: form.unit_price ? parseFloat(form.unit_price) : null,
    };

    const { error } = await (editId
      ? updateTreatment(editId, payload)
      : createTreatment(payload));
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

      {isMobile ? (
        <Box>
          {visible.length === 0 ? (
            <Typography
              size={{ color: "text.secondary", textAlign: "center", mt: 4 }}
            >
              Sin tratamientos
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
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tratamiento</TableCell>
                <TableCell>Tipo</TableCell>
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
                    colSpan={6}
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
                    <Typography variant="body2" fontWeight={500}>
                      {t.name}
                    </Typography>
                    {t.description && (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {t.description.length > 55
                          ? t.description.slice(0, 55) + "…"
                          : t.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <TreatmentTypeChip
                      isMultisession={t.is_multisession}
                      unitPrice={t.unit_price}
                    />
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
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{
                        color: t.is_multisession
                          ? "text.secondary"
                          : t.unit_price
                            ? "warning.dark"
                            : "success.main",
                      }}
                    >
                      {t.unit_price
                        ? `S/ ${Number(t.unit_price).toFixed(2)}/unidad`
                        : t.is_multisession
                          ? "Pactado por caso"
                          : `S/ ${Number(t.price).toFixed(2)}`}
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

      {/* Modal */}
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
                label="Nombre del tratamiento *"
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

            {/* Tipo de tratamiento */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5 }}>
                  Tipo de tratamiento
                </Typography>

                <FormControlLabel
                  sx={{ mb: 1, alignItems: "flex-start" }}
                  control={
                    <Switch
                      checked={form.is_multisession}
                      color="primary"
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          is_multisession: e.target.checked,
                          unit_price: e.target.checked ? "" : p.unit_price,
                        }))
                      }
                    />
                  }
                  label={
                    <Box sx={{ pt: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Tratamiento multisesión
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Se cita al paciente varias veces. El costo total se
                        pacta al crear el caso.
                      </Typography>
                    </Box>
                  }
                />

                {!form.is_multisession && (
                  <FormControlLabel
                    sx={{ alignItems: "flex-start" }}
                    control={
                      <Switch
                        checked={!!form.unit_price}
                        color="warning"
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            unit_price: e.target.checked ? "50" : "",
                            price: e.target.checked ? "0" : p.price,
                          }))
                        }
                      />
                    }
                    label={
                      <Box sx={{ pt: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>
                          Precio por unidad
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          El total se calcula por cantidad (ej: por diente
                          tratado).
                        </Typography>
                      </Box>
                    }
                  />
                )}

                {form.is_multisession && (
                  <Alert severity="info" sx={{ mt: 1.5 }} icon={false}>
                    <Typography variant="caption">
                      El precio se acuerda con el paciente al abrir el caso de
                      tratamiento. Las sesiones adicionales tienen costo S/ 0
                      por defecto.
                    </Typography>
                  </Alert>
                )}

                {!form.is_multisession && form.unit_price && (
                  <Alert severity="warning" sx={{ mt: 1.5 }} icon={false}>
                    <Typography variant="caption">
                      Al crear una cita se pedirá la cantidad de unidades y el
                      total se calculará automáticamente.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Grid>

            {/* Precio por sesión — solo si no es multisesión ni por unidad */}
            {!form.is_multisession && !form.unit_price && (
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Precio por sesión *"
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
            )}

            {/* Precio por unidad */}
            {!form.is_multisession && !!form.unit_price && (
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Precio por unidad *"
                  type="number"
                  value={form.unit_price}
                  onChange={set("unit_price")}
                  size="small"
                  fullWidth
                  helperText="Por diente / pieza"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">S/</InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            )}

            {/* Duración */}
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Duración por sesión"
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

            {/* Descripción */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Descripción"
                value={form.description}
                onChange={set("description")}
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder="Descripción del tratamiento, indicaciones..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : editId ? (
              "Guardar cambios"
            ) : (
              "Crear tratamiento"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
