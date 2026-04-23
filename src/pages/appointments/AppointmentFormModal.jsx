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
} from "@mui/material";
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
  const { createAppointment, saving } = useAppointmentStore();
  const { doctors, treatments, fetchAll } = useCatalogStore();
  const { patients, fetchPatients } = usePatientStore();
  const { profile } = useAuthStore();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchAll();
      fetchPatients();
      setForm({
        ...EMPTY,
        date: prefillDate ? toDatetimeLocal(prefillDate) : "",
      });
      setError("");
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

    // Calcular end_date según duración del tratamiento
    const treatment = treatments.find((t) => t.id === form.treatment_id);
    const startDate = new Date(form.date);
    const endDate = new Date(
      startDate.getTime() + (treatment?.duration_min ?? 30) * 60000,
    );

    const payload = {
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      treatment_id: form.treatment_id || null,
      date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total: parseFloat(form.total) || 0,
      notes: form.notes || null,
      created_by: profile?.id ?? null,
    };

    const { error } = await createAppointment(payload);
    if (error) {
      setError(error);
      return;
    }
    onClose(true);
  };

  // Filtrar doctores por especialidad del tratamiento seleccionado
  const treatment = treatments.find((t) => t.id === form.treatment_id);
  const filteredDoctors = treatment?.specialty_id
    ? doctors.filter((d) => d.specialty_id === treatment.specialty_id)
    : doctors;

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva cita</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          {/* Paciente con búsqueda */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={patients}
              getOptionLabel={(p) =>
                `${p.full_name}${p.dni ? " — " + p.dni : ""}`
              }
              onChange={(_, val) =>
                setForm((f) => ({ ...f, patient_id: val?.id ?? "" }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Paciente *" size="small" />
              )}
            />
          </Grid>

          {/* Tratamiento */}
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

          {/* Doctor (filtrado por especialidad del tratamiento) */}
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
                <MenuItem disabled>No hay doctores disponibles</MenuItem>
              )}
              {filteredDoctors.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.profile?.full_name ?? d.id}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Fecha y hora */}
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

          {/* Total */}
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

          {/* Notas */}
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
