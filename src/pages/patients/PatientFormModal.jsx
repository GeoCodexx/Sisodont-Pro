import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Typography,
} from "@mui/material";
import { usePatientStore } from "../../stores/usePatientStore";

const EMPTY = {
  full_name: "",
  dni: "",
  birth_date: "",
  phone: "",
  email: "",
  address: "",
  gender: "",
  diabetes: false,
  hypertension: false,
  pregnancy: false,
  allergies: "",
  medications: "",
  diagnosis: "",
  observations: "",
};

export default function PatientFormModal({ open, patient, onClose }) {
  const { createPatient, updatePatient, saving } = usePatientStore();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patient) {
      setForm({
        full_name: patient.full_name ?? "",
        dni: patient.dni ?? "",
        birth_date: patient.birth_date ?? "",
        phone: patient.phone ?? "",
        email: patient.email ?? "",
        address: patient.address ?? "",
        gender: patient.gender ?? "",
        diabetes: patient.diabetes ?? false,
        hypertension: patient.hypertension ?? false,
        pregnancy: patient.pregnancy ?? false,
        allergies: patient.allergies ?? "",
        medications: patient.medications ?? "",
        diagnosis: patient.diagnosis ?? "",
        observations: patient.observations ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [patient, open]);

  const set = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const result = patient
      ? await updatePatient(patient.id, form)
      : await createPatient(form);

    if (result.error) {
      setError(result.error);
      return;
    }
    onClose(true);
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {patient ? "Editar paciente" : "Nuevo paciente"}
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="overline" color="text.secondary">
          Datos personales
        </Typography>
        <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nombre completo *"
              value={form.full_name}
              onChange={set("full_name")}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="DNI"
              value={form.dni}
              onChange={set("dni")}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              label="Género"
              value={form.gender}
              onChange={set("gender")}
              size="small"
              fullWidth
            >
              <MenuItem value="">Sin especificar</MenuItem>
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="F">Femenino</MenuItem>
              <MenuItem value="otro">Otro</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Fecha de nacimiento"
              type="date"
              value={form.birth_date}
              onChange={set("birth_date")}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Teléfono"
              value={form.phone}
              onChange={set("phone")}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={set("email")}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Dirección"
              value={form.address}
              onChange={set("address")}
              size="small"
              fullWidth
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="overline" color="text.secondary">
          Antecedentes clínicos
        </Typography>
        <Grid container spacing={1} sx={{ mt: 0.5, mb: 2 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.diabetes}
                  onChange={set("diabetes")}
                  size="small"
                />
              }
              label="Diabetes"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.hypertension}
                  onChange={set("hypertension")}
                  size="small"
                />
              }
              label="Hipertensión"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.pregnancy}
                  onChange={set("pregnancy")}
                  size="small"
                />
              }
              label="Gestante"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Alergias"
              value={form.allergies}
              onChange={set("allergies")}
              size="small"
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Medicamentos actuales"
              value={form.medications}
              onChange={set("medications")}
              size="small"
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Diagnóstico"
              value={form.diagnosis}
              onChange={set("diagnosis")}
              size="small"
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Observaciones"
              value={form.observations}
              onChange={set("observations")}
              size="small"
              fullWidth
              multiline
              rows={3}
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
          ) : patient ? (
            "Guardar cambios"
          ) : (
            "Crear paciente"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
