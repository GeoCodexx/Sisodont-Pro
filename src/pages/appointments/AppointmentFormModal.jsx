import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  InputAdornment,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Box,
  Typography,
  Divider,
  Paper,
  IconButton,
  Collapse,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useAppointmentStore } from "../../stores/useAppointmentStore";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { usePatientStore } from "../../stores/usePatientStore";
import { useAuthStore } from "../../stores/useAuthStore";

const toDatetimeLocal = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

// Limpia espacios duplicados
const cleanSpaces = (value) => {
  return value.trim().replace(/\s+/g, " ");
};

// Convierte cada palabra a Mayúscula Inicial
const capitalizeWords = (value) => {
  return cleanSpaces(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const EMPTY = {
  patient_id: "",
  doctor_id: "",
  treatment_id: "",
  date: "",
  notes: "",
  total: "",
};

// ── Mini formulario de paciente rápido ────────────────────────
function QuickPatientForm({ onCreated, onCancel, saving }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const valid = firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mt: 1,
        mb: 0.5,
        borderColor: "primary.main",
        borderWidth: 1.5,
        borderRadius: 2,
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonAddIcon fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={500} color="primary.main">
            Nuevo paciente rápido
          </Typography>
        </Box>
        <IconButton size="small" onClick={onCancel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1.5 }}
      >
        Solo nombre y apellido. Completa el resto del historial después desde el
        módulo de Pacientes.
      </Typography>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Nombre(s) *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            size="small"
            fullWidth
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && valid && onCreated(fullName)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Apellido(s) *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            size="small"
            fullWidth
            onKeyDown={(e) => e.key === "Enter" && valid && onCreated(fullName)}
          />
        </Grid>
      </Grid>

      {fullName && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
        >
          Se creará como: <strong>{fullName}</strong>
        </Typography>
      )}

      <Box
        sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "flex-end" }}
      >
        <Button size="small" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={
            saving ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <AddIcon />
            )
          }
          onClick={() => onCreated(fullName)}
          disabled={!valid || saving}
        >
          {saving ? "Creando..." : "Crear y seleccionar"}
        </Button>
      </Box>
    </Paper>
  );
}

// ── Modal principal ───────────────────────────────────────────
export default function AppointmentFormModal({ open, prefillDate, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { createAppointment, saving } = useAppointmentStore();
  const { doctors, treatments, fetchAll } = useCatalogStore();
  const { patients, fetchPatients, createQuickPatient } = usePatientStore();
  const { profile } = useAuthStore();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");

  useEffect(() => {
    if (open) {
      fetchAll();
      fetchPatients({ page: 1, pageSize: 200 });
      setForm({
        ...EMPTY,
        date: prefillDate ? toDatetimeLocal(prefillDate) : "",
      });
      setSelectedPatient(null);
      setShowQuickForm(false);
      setError("");
      setQuickError("");
    }
  }, [open]);

  // Auto-completar precio cuando se elige tratamiento
  useEffect(() => {
    if (form.treatment_id) {
      const t = treatments.find((t) => t.id === form.treatment_id);
      if (t) setForm((f) => ({ ...f, total: t.price }));
    }
  }, [form.treatment_id]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Crear paciente rápido y seleccionarlo automáticamente
  const handleQuickCreate = async (fullName) => {
    if (!fullName.trim()) return;
    setQuickSaving(true);
    setQuickError("");
    const { data, error } = await createQuickPatient(capitalizeWords(fullName));
    setQuickSaving(false);
    if (error) {
      setQuickError(error);
      return;
    }

    // Refrescar lista y seleccionar el nuevo paciente
    await fetchPatients({ page: 1, pageSize: 200 });
    setSelectedPatient(data);
    setForm((f) => ({ ...f, patient_id: data.id }));
    setShowQuickForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.patient_id) {
      setError("Selecciona o crea un paciente.");
      return;
    }
    if (!form.doctor_id) {
      setError("Selecciona un doctor.");
      return;
    }
    if (!form.date) {
      setError("Ingresa la fecha y hora.");
      return;
    }

    const treatment = treatments.find((t) => t.id === form.treatment_id);
    const startDate = new Date(form.date);
    const endDate = new Date(
      startDate.getTime() + (treatment?.duration_min ?? 30) * 60000,
    );

    const { error } = await createAppointment({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      treatment_id: form.treatment_id || null,
      date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total: parseFloat(form.total) || 0,
      notes: form.notes || null,
      created_by: profile?.id ?? null,
    });
    if (error) {
      setError(error);
      return;
    }
    onClose(true);
  };

  const filteredDoctors = form.treatment_id
    ? doctors.filter((d) => {
        const t = treatments.find((t) => t.id === form.treatment_id);
        return !t?.specialty_id || d.specialty_id === t.specialty_id;
      })
    : doctors;

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>Nueva cita</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* ── Selector de paciente ── */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={patients}
              getOptionLabel={(p) =>
                `${p.full_name}${p.dni ? " — " + p.dni : ""}`
              }
              value={selectedPatient}
              onChange={(_, val) => {
                setSelectedPatient(val);
                setForm((f) => ({ ...f, patient_id: val?.id ?? "" }));
                if (val) setShowQuickForm(false);
              }}
              // Opción especial al no encontrar resultados
              noOptionsText={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    py: 0.5,
                  }}
                  onClick={() => setShowQuickForm(true)}
                >
                  <PersonAddIcon fontSize="small" color="primary" />
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={500}
                  >
                    Crear paciente rápido
                  </Typography>
                </Box>
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Paciente *"
                  size="small"
                  helperText={
                    !selectedPatient && !showQuickForm
                      ? "Escribe para buscar. Si no está en la lista, créalo rápido."
                      : selectedPatient
                        ? "✓ Paciente seleccionado — Si es nuevo, completa sus datos en el módulo Pacientes"
                        : ""
                  }
                />
              )}
            />

            {/* Botón alternativo siempre visible para crear rápido */}
            {!selectedPatient && !showQuickForm && (
              <Button
                size="small"
                startIcon={<PersonAddIcon fontSize="small" />}
                onClick={() => setShowQuickForm(true)}
                sx={{ mt: 0.75, fontSize: 12 }}
              >
                ¿Paciente nuevo? Créalo aquí
              </Button>
            )}

            {/* Mini formulario inline */}
            <Collapse in={showQuickForm} unmountOnExit>
              {quickError && (
                <Alert
                  severity="error"
                  sx={{ mt: 1 }}
                  onClose={() => setQuickError("")}
                >
                  {quickError}
                </Alert>
              )}
              <QuickPatientForm
                onCreated={handleQuickCreate}
                onCancel={() => setShowQuickForm(false)}
                saving={quickSaving}
              />
            </Collapse>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* ── Tratamiento ── */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Tratamiento"
              value={form.treatment_id}
              onChange={set("treatment_id")}
              size="small"
              fullWidth
            >
              <MenuItem value="">Sin especificar</MenuItem>
              {treatments.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name} — S/ {Number(t.price).toFixed(2)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* ── Doctor ── */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Doctor *"
              value={form.doctor_id}
              onChange={set("doctor_id")}
              size="small"
              fullWidth
            >
              {filteredDoctors.length === 0 && (
                <MenuItem disabled>Sin doctores disponibles</MenuItem>
              )}
              {filteredDoctors.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.profile?.full_name ?? d.id}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* ── Fecha y hora ── */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Fecha y hora *"
              type="datetime-local"
              value={form.date}
              onChange={set("date")}
              size="small"
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>

          {/* ── Total ── */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Total"
              type="number"
              value={form.total}
              onChange={set("total")}
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

          {/* ── Notas ── */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Notas"
              value={form.notes}
              onChange={set("notes")}
              size="small"
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => onClose(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || quickSaving}
        >
          {saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Crear cita"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
