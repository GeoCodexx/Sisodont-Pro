import { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
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
  Typography,
  Alert,
  Fade,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ToggleOnIcon from "@mui/icons-material/TaskAlt";
import ToggleOffIcon from "@mui/icons-material/Block";
import { useCatalogStore } from "../../stores/useCatalogStore";
import useSnackbarStore from "../../stores/useSnackbarStore";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const EMPTY = { name: "", color: "#534AB7" };

// ── DoctorCard — vista móvil ──────────────────────────────────
function SpecialtyCard({ s, onEdit, onToggleActive, isSuperAdmin }) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {s.name ?? "—"}
            </Typography>
          </Box>
          {isSuperAdmin && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => onEdit(s)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Activar/Desactivar */}
              <Tooltip title={s.active ? "Desactivar" : "Activar"}>
                <IconButton size="small" onClick={() => onToggleActive(s)}>
                  {s.active ? (
                    <ToggleOffIcon fontSize="small" color="error" />
                  ) : (
                    <ToggleOnIcon fontSize="small" color="success" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Chip
            label={s.color}
            size="small"
            sx={{
              bgcolor: s.color,
              color: "#fff",
              fontFamily: "monospace",
            }}
          />
          <Chip
            label={s.active ? "Activo" : "Inactivo"}
            size="small"
            color={s.active ? "success" : "default"}
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// SpecialtiesTab
//
// isSuperAdmin = true  → CRUD completo
// isSuperAdmin = false → solo lectura + banner informativo
// ─────────────────────────────────────────────────────────────
export default function SpecialtiesTab({ isSuperAdmin }) {
  const { isMobile } = useBreakpoint();
  const {
    specialties,
    saving,
    createSpecialty,
    updateSpecialty,
  } = useCatalogStore();

  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [specialtyToToggle, setSpecialtyToToggle] = useState(null);
  const [showButtons, setShowButtons] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  // Animación de entrada de botones en mobile
  useEffect(() => {
    if (open && isMobile) {
      const timer = setTimeout(() => setShowButtons(true), 300);
      return () => clearTimeout(timer);
    } else if (open) {
      setShowButtons(true);
    } else {
      setShowButtons(false);
    }
  }, [open, isMobile]);

  const setField = (f) => (e) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const openCreate = () => {
    setErrors({});
    setForm(EMPTY);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (s) => {
    setErrors({});
    setForm({
      name: s.name,
      color: s.color,
    });
    setEditId(s.id);
    setOpen(true);
  };

  const handleSave = async () => {
    const validationErrors = {};
    if (!form.name.trim())
      validationErrors.name = "Ingrese el nombre de la especialidad.";
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);

      return;
    }

    setErrors({});

    const fn = editId ? updateSpecialty(editId, form) : createSpecialty(form);
    const { error } = await fn;
    if (error) {
      showSnackbar(error, "error");
      return;
    }
    showSnackbar(
      editId ? "Especialidad actualizada." : "Especialidad creada.",
      "success",
    );
    setOpen(false);
  };


  // const handleToggleActive = async (s) => {
  //   const newActive = !s.active;
  //   const action = newActive ? "Activar" : "Desactivar";
  //   if (!window.confirm(`¿${action} esta especialidad?`)) return;

  //   const { error } = await updateSpecialty(s.id, { active: newActive });

  //   if (error) showSnackbar(error, "error");
  //   else
  //     showSnackbar(`Especialidad ${newActive ? "activada" : "desactivada"}.`);
  // };

  const dialogTitle = specialtyToToggle?.active
    ? "Desactivar especialidad"
    : "Activar especialidad";

  const dialogMessage = specialtyToToggle?.active
    ? `¿Desea desactivar la especialidad "${specialtyToToggle?.name}"?`
    : `¿Desea activar la especialidad "${specialtyToToggle?.name}"?`;

  const confirmText = specialtyToToggle?.active ? "Desactivar" : "Activar";

  const confirmColor = specialtyToToggle?.active ? "error" : "success";

  const handleConfirmToggle = async () => {
    if (!specialtyToToggle) return;

    setLoadingConfirm(true);

    const newActive = !specialtyToToggle.active;

    const { error } = await updateSpecialty(specialtyToToggle.id, {
      active: newActive,
    });

    if (error) {
      showSnackbar(error, "error");
    } else {
      showSnackbar(
        `Especialidad ${newActive ? "activada" : "desactivada"}.`,
        "success",
      );
    }

    setLoadingConfirm(false);

    setSpecialtyToToggle(null);
  };

  return (
    <Box>
      {/* Banner informativo para ADMIN */}
      {!isSuperAdmin && (
        <Alert
          severity="info"
          icon={<LockIcon fontSize="small" />}
          sx={{ mb: 2 }}
        >
          La lista de especialidades son administrados globalmente por el area
          de soporte. Puedes consultarlos pero no modificarlos.
        </Alert>
      )}

      {/* Botón solo para SUPER_ADMIN */}
      {isSuperAdmin && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            Nueva especialidad
          </Button>
        </Box>
      )}

      {isMobile ? (
        <Box>
          {specialties.length === 0 ? (
            <Typography
              sx={{ color: "text.secondary", textAlign: "center", mt: 4 }}
            >
              No hay doctores registrados
            </Typography>
          ) : (
            specialties.map((s) => (
              <SpecialtyCard
                key={s.id}
                s={s}
                onEdit={openEdit}
                onToggleActive={() => setSpecialtyToToggle(s)}
                isSuperAdmin={isSuperAdmin}
              />
            ))
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Color</TableCell>
                {isSuperAdmin && <TableCell align="right">Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {specialties.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 3 : 2}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No hay especialidades registradas
                  </TableCell>
                </TableRow>
              )}
              {specialties.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant="body2">{s.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.color}
                      size="small"
                      sx={{
                        bgcolor: s.color,
                        color: "#fff",
                        fontFamily: "monospace",
                      }}
                    />
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(s)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* Activar/desactivar */}
                      <Tooltip title={s.active ? "Desactivar" : "Activar"}>
                        <IconButton
                          size="small"
                          onClick={() => setSpecialtyToToggle(s)}
                        >
                          {s.active ? (
                            <ToggleOffIcon fontSize="small" color="error" />
                          ) : (
                            <ToggleOnIcon fontSize="small" color="success" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal — solo renderiza si SUPER_ADMIN */}
      {isSuperAdmin && (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="xs"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: (theme) => theme.palette.primary.main,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {editId ? (
                <EditIcon sx={{ color: "white" }} />
              ) : (
                <SaveIcon sx={{ color: "white" }} />
              )}
              <Typography
                variant="h6"
                component="span"
                sx={{ color: "white" /*, fontWeight: 600 */ }}
              >
                {editId ? "Editar especialidad" : "Nueva especialidad"}
              </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={() => setOpen(false)}
              size="small"
              sx={{
                color: "white",
                "&:hover": {
                  bgcolor: (theme) => theme.palette.action.hover,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: "16px !important",
            }}
          >
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => {
                setField("name")(e);

                if (errors.name) {
                  setErrors((prev) => ({
                    ...prev,
                    name: "",
                  }));
                }
              }}
              error={!!errors.name}
              helperText={errors.name}
              size="small"
              fullWidth
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
            {/* Botones dentro del contenido en mobile con animación */}
            {isMobile && (
              <Fade in={showButtons} timeout={500}>
                <Stack spacing={1.5} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={
                      saving ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : null
                    }
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    onClick={() => setOpen(false)}
                    variant="outlined"
                    size="large"
                    fullWidth
                    color="inherit"
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Fade>
            )}
          </DialogContent>
          {isMobile || (
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogActions>
          )}
        </Dialog>
      )}
      <ConfirmDialog
        open={!!specialtyToToggle}
        title={dialogTitle}
        message={dialogMessage}
        confirmText={confirmText}
        confirmColor={confirmColor}
        onClose={() => setSpecialtyToToggle(null)}
        onConfirm={handleConfirmToggle}
        loading={loadingConfirm}
      />
    </Box>
  );
}
