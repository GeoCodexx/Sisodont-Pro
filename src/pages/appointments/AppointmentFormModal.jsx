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
  IconButton,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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

const EMPTY = {
  patient_id: "",
  doctor_id: "",
  treatment_id: "",
  date: "",
  notes: "",
  total: "",
};

export default function AppointmentFormModal({ open, prefillDate, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { createAppointment, saving } = useAppointmentStore();
  const { doctors, treatments, fetchAll } = useCatalogStore();
  const { patients, fetchPatients, createQuickPatient } = usePatientStore();
  const { profile } = useAuthStore();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  // Estados para creación rápida de paciente
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  const [quickPatientName, setQuickPatientName] = useState({
    firstName: "",
    lastName: "",
  });
  const [creatingQuick, setCreatingQuick] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (open) {
      fetchAll();
      fetchPatients({ page: 1, pageSize: 200 });
      setForm({
        ...EMPTY,
        date: prefillDate ? toDatetimeLocal(prefillDate) : "",
      });
      setError("");
      setShowQuickPatientForm(false);
      setQuickPatientName({ firstName: "", lastName: "" });
    }
  }, [open, prefillDate, fetchAll, fetchPatients]);

  useEffect(() => {
    if (form.treatment_id) {
      const t = treatments.find((t) => t.id === form.treatment_id);
      if (t) setForm((f) => ({ ...f, total: t.price }));
    }
  }, [form.treatment_id, treatments]);

  const setField = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.patient_id) {
      setError("Selecciona un paciente.");
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

  const handleCreateQuickPatient = async () => {
    if (!quickPatientName.firstName.trim()) {
      setError("El nombre es obligatorio para crear un paciente rápido.");
      return;
    }
    setCreatingQuick(true);
    const { data, error: err } = await createQuickPatient({
      firstName: quickPatientName.firstName.trim(),
      lastName: quickPatientName.lastName.trim(),
    });
    setCreatingQuick(false);
    if (err) {
      setError(`Error al crear paciente: ${err}`);
      return;
    }
    if (data) {
      // Seleccionar el paciente recién creado
      setForm((f) => ({ ...f, patient_id: data.id }));
      // Limpiar y ocultar formulario rápido
      setQuickPatientName({ firstName: "", lastName: "" });
      setShowQuickPatientForm(false);
    }
  };

  const filteredDoctors = form.treatment_id
    ? doctors.filter((d) => {
        const t = treatments.find((t) => t.id === form.treatment_id);
        return !t?.specialty_id || d.specialty_id === t.specialty_id;
      })
    : doctors;

  const selectedPatient =
    patients.find((p) => p.id === form.patient_id) || null;

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
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={patients}
              value={selectedPatient}
              inputValue={searchInput}
              onInputChange={(_, newInputValue) =>
                setSearchInput(newInputValue)
              }
              getOptionLabel={(p) =>
                p && p.full_name
                  ? `${p.full_name}${p.dni ? " — " + p.dni : ""}`
                  : ""
              }
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              filterOptions={(options, state) => {
                const inputValue = state.inputValue.trim().toLowerCase();
                // Filtrar pacientes
                let filtered = options.filter((option) => {
                  if (!inputValue) return true;
                  const fullNameMatch = option.full_name
                    ?.toLowerCase()
                    .includes(inputValue);
                  const dniMatch = option.dni
                    ?.toLowerCase()
                    .includes(inputValue);
                  return fullNameMatch || dniMatch;
                });

                // Agregar opción de creación rápida si hay texto y no hay coincidencia exacta
                if (inputValue.length > 0) {
                  const exactMatch = filtered.some(
                    (p) => p.full_name?.toLowerCase() === inputValue,
                  );
                  if (!exactMatch) {
                    filtered.push({
                      id: "__quick_create__",
                      full_name: `＋ Crear paciente rápido: "${state.inputValue}"`,
                      isQuickCreate: true,
                    });
                  }
                }
                return filtered;
              }}
              onChange={(_, newValue) => {
                if (newValue?.isQuickCreate) {
                  setShowQuickPatientForm(true);
                  // Prellenar el formulario rápido con lo que escribió el usuario
                  if (searchInput) {
                    const parts = searchInput.trim().split(" ");
                    setQuickPatientName({
                      firstName: parts[0] || "",
                      lastName: parts.slice(1).join(" ") || "",
                    });
                  }
                  return;
                }
                setForm((f) => ({ ...f, patient_id: newValue?.id ?? "" }));
                // Limpiar el texto de búsqueda opcionalmente
                // setSearchInput("");
              }}
              renderInput={(params) => (
                <TextField {...params} label="Paciente *" size="small" />
              )}
              renderOption={(props, option) => {
                if (option.isQuickCreate) {
                  return (
                    <li
                      {...props}
                      key="quick-create"
                      style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}
                    >
                      {option.full_name}
                    </li>
                  );
                }
                return (
                  <li {...props} key={option.id}>
                    {option.full_name}
                    {option.dni ? ` — ${option.dni}` : ""}
                  </li>
                );
              }}
            />

            {/* Mini formulario de creación rápida inline */}
            {showQuickPatientForm && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  bgcolor: "#fafafa",
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <strong>Crear paciente rápido</strong>
                  <IconButton
                    size="small"
                    onClick={() => setShowQuickPatientForm(false)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="Nombre *"
                      size="small"
                      fullWidth
                      value={quickPatientName.firstName}
                      onChange={(e) =>
                        setQuickPatientName((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="Apellido"
                      size="small"
                      fullWidth
                      value={quickPatientName.lastName}
                      onChange={(e) =>
                        setQuickPatientName((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                </Grid>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    justifyContent: "flex-end",
                    mt: 1,
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => setShowQuickPatientForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleCreateQuickPatient}
                    disabled={creatingQuick}
                  >
                    {creatingQuick ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Crear y seleccionar"
                    )}
                  </Button>
                </Stack>
              </Box>
            )}
          </Grid>

          {/* El resto de los campos del formulario (Tratamiento, Doctor, etc.) se mantienen igual */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Tratamiento"
              value={form.treatment_id}
              onChange={setField("treatment_id")}
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

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Doctor *"
              value={form.doctor_id}
              onChange={setField("doctor_id")}
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

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Fecha y hora *"
              type="datetime-local"
              value={form.date}
              onChange={setField("date")}
              size="small"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Total"
              type="number"
              value={form.total}
              onChange={setField("total")}
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

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Notas"
              value={form.notes}
              onChange={setField("notes")}
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
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
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
