import { useEffect } from "react";
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
import { useForm, Controller } from "react-hook-form";
import { usePatientStore } from "../../stores/usePatientStore";

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────
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

const TODAY = new Date().toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────
// Helpers puros
// ─────────────────────────────────────────────────────────────
const onlyLetters = (v) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
const onlyNumbers = (v) => v.replace(/\D/g, "");
const cleanSpaces = (v) => v.trim().replace(/\s+/g, " ");
const capitalizeWords = (v) =>
  cleanSpaces(v)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function buildDefaultValues(patient) {
  if (!patient) return EMPTY;

  const nameFields =
    patient.first_name || patient.last_name || patient.mother_last_name
      ? {
          first_name: patient.first_name ?? "",
          last_name: patient.last_name ?? "",
          mother_last_name: patient.mother_last_name ?? "",
        }
      : {
          first_name: patient.full_name ?? "",
          last_name: "",
          mother_last_name: "",
        };

  return {
    ...nameFields,
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
  };
}

// ─────────────────────────────────────────────────────────────
// PatientFormModal
// ─────────────────────────────────────────────────────────────
export default function PatientFormModal({ open, patient, onClose }) {
  const { createPatient, updatePatient, saving } = usePatientStore();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY });

  // Reiniciar form cuando cambia patient u open
  useEffect(() => {
    reset(buildDefaultValues(patient));
  }, [patient, open, reset]);

  // ── Submit ────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const full_name = capitalizeWords(
      [data.first_name, data.last_name, data.mother_last_name]
        .filter(Boolean)
        .join(" "),
    );

    const payload = {
      ...data,
      full_name,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      mother_last_name: data.mother_last_name.trim() || null,
      dni: data.dni || null,
      birth_date: data.birth_date || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      gender: data.gender || null,
      allergies: data.allergies || null,
      medications: data.medications || null,
      diagnosis: data.diagnosis || null,
      observations: data.observations || null,
    };

    const result = patient
      ? await updatePatient(patient.id, payload)
      : await createPatient(payload);

    if (result.error) {
      // Muestra el error del servidor como error global en el campo raíz
      setError("root.serverError", { message: result.error });
      return;
    }

    onClose(true);
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {patient ? "Editar paciente" : "Nuevo paciente"}
      </DialogTitle>

      <DialogContent dividers>
        {errors.root?.serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.root.serverError.message}
          </Alert>
        )}

        {/* ── Datos personales ── */}
        <Typography variant="overline" color="text.secondary">
          Datos personales
        </Typography>
        <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
          {/* Nombres */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Nombres"
              size="small"
              fullWidth
              required
              error={!!errors.first_name}
              helperText={errors.first_name?.message}
              {...register("first_name", {
                required: "Nombres son obligatorios.",
                setValueAs: onlyLetters,
              })}
            />
          </Grid>

          {/* Primer apellido */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Primer apellido"
              size="small"
              fullWidth
              required
              error={!!errors.last_name}
              helperText={errors.last_name?.message}
              {...register("last_name", {
                required: "Primer apellido es obligatorio.",
                setValueAs: onlyLetters,
              })}
            />
          </Grid>

          {/* Segundo apellido */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Segundo apellido"
              size="small"
              fullWidth
              {...register("mother_last_name", {
                setValueAs: onlyLetters,
              })}
            />
          </Grid>

          {/* DNI */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="DNI"
              size="small"
              fullWidth
              slotProps={{
                htmlInput:{ maxLength: 8, inputMode: "numeric" }
              }}
              error={!!errors.dni}
              helperText={errors.dni?.message}
              {...register("dni", {
                setValueAs: (v) => onlyNumbers(v).slice(0, 8),
                validate: (v) =>
                  !v || v.length === 8 || "El DNI debe tener exactamente 8 dígitos.",
              })}
            />
          </Grid>

          {/* Género — select necesita Controller */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Género"
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">Sin especificar</MenuItem>
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          {/* Fecha de nacimiento */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Fecha de nacimiento"
              type="date"
              size="small"
              fullWidth
              error={!!errors.birth_date}
              helperText={errors.birth_date?.message}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: TODAY },
              }}
              {...register("birth_date", {
                validate: (v) =>
                  !v ||
                  v <= TODAY ||
                  "La fecha de nacimiento no puede ser futura.",
              })}
            />
          </Grid>

          {/* Teléfono */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Teléfono"
              size="small"
              fullWidth
              slotProps={{
                htmlInput:{ maxLength: 9, inputMode: "numeric" }
              }}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              {...register("phone", {
                setValueAs: (v) => onlyNumbers(v).slice(0, 9),
                validate: (v) =>
                  !v || v.length === 9 || "El teléfono debe tener exactamente 9 dígitos.",
              })}
            />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Correo electrónico"
              type="email"
              size="small"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register("email", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Correo electrónico inválido.",
                },
              })}
            />
          </Grid>

          {/* Dirección */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Dirección"
              size="small"
              fullWidth
              {...register("address")}
            />
          </Grid>
        </Grid>

        {/* ── Antecedentes clínicos ── */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="overline" color="text.secondary">
          Antecedentes clínicos
        </Typography>
        <Grid container spacing={1} sx={{ mt: 0.5, mb: 2 }}>
          {[
            { name: "diabetes", label: "Diabetes" },
            { name: "hypertension", label: "Hipertensión" },
            { name: "pregnancy", label: "Gestante" },
          ].map(({ name, label }) => (
            <Grid size={{ xs: 6, sm: 3 }} key={name}>
              <Controller
                name={name}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label={label}
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        size="small"
                      />
                    }
                  />
                )}
              />
            </Grid>
          ))}
        </Grid>

        {/* ── Campos clínicos de texto ── */}
        <Grid container spacing={2}>
          {[
            { name: "allergies", label: "Alergias", rows: 2 },
            { name: "medications", label: "Medicamentos actuales", rows: 2 },
            { name: "diagnosis", label: "Diagnóstico", rows: 3 },
            { name: "observations", label: "Observaciones", rows: 3 },
          ].map(({ name, label, rows }) => (
            <Grid size={{ xs: 12, sm: 6 }} key={name}>
              <TextField
                label={label}
                size="small"
                fullWidth
                multiline
                rows={rows}
                {...register(name)}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => onClose(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
        >
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