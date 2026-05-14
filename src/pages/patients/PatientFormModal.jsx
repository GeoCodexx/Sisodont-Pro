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
  first_name: "",
  last_name: "",
  mother_last_name: "",
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

// Elimina números y caracteres no válidos
const onlyLetters = (value) => {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
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

const onlyNumbers = (value) => {
  return value.replace(/\D/g, "");
};

const isFutureDate = (date) => {
  if (!date) return false;

  const today = new Date();
  const selected = new Date(date);

  today.setHours(0, 0, 0, 0);
  selected.setHours(0, 0, 0, 0);

  return selected > today;
};

export default function PatientFormModal({ open, patient, onClose }) {
  const { createPatient, updatePatient, saving } = usePatientStore();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patient) {
      const parts = (patient.full_name || "").split(" ");

      setForm({
        first_name: parts.slice(0, -2).join(" ") || "",
        last_name: parts.at(-2) || "",
        mother_last_name: parts.at(-1) || "",

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

  const setNameField = (field) => (e) => {
    setForm((f) => ({
      ...f,
      [field]: onlyLetters(e.target.value),
    }));
  };

  const setNumberField = (field, maxLength) => (e) => {
    const value = onlyNumbers(e.target.value).slice(0, maxLength);

    setForm((f) => ({
      ...f,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.mother_last_name.trim()
    ) {
      setError("Nombres y apellidos son obligatorios.");
      return;
    }

    if (!form.dni.trim()) {
      setError("El DNI es obligatorio.");
      return;
    }

    if (form.dni.length !== 8) {
      setError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    if (!form.phone.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }

    if (form.phone.length !== 9) {
      setError("El teléfono debe tener exactamente 9 dígitos.");
      return;
    }

    if (isFutureDate(form.birth_date)) {
      setError("La fecha de nacimiento no puede ser futura.");
      return;
    }

    // Construir nombre completo
    const full_name = capitalizeWords(`
    ${form.first_name}
    ${form.last_name}
    ${form.mother_last_name}
  `);

    // Payload final
    const payload = {
      ...form,

      full_name,

      // Enviar NULL si está vacío
      birth_date: form.birth_date || null,
      gender: form.gender || null,
    };

    // Eliminar campos temporales
    delete payload.first_name;
    delete payload.last_name;
    delete payload.mother_last_name;

    const result = patient
      ? await updatePatient(patient.id, payload)
      : await createPatient(payload);

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
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Nombres *"
              value={form.first_name}
              onChange={setNameField("first_name")}
              size="small"
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Primer apellido *"
              value={form.last_name}
              onChange={setNameField("last_name")}
              size="small"
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Segundo apellido *"
              value={form.mother_last_name}
              onChange={setNameField("mother_last_name")}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="DNI *"
              value={form.dni}
              onChange={setNumberField("dni", 8)}
              size="small"
              fullWidth
              slotProps={{
                htmlInput: {
                  maxLength: 8,
                  inputMode: "numeric",
                },
              }}
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
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: {
                  max: new Date().toISOString().split("T")[0],
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Teléfono *"
              value={form.phone}
              onChange={setNumberField("phone", 9)}
              size="small"
              fullWidth
              slotProps={{
                htmlInput: {
                  maxLength: 9,
                  inputMode: "numeric",
                },
              }}
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
