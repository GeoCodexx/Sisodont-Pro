import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
} from "@mui/material";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useAuthStore } from "../../stores/useAuthStore";

export default function SettingsPage() {
  const { settings, loading, saving, fetchSettings, updateMany } =
    useSettingsStore();
  const { profile } = useAuthStore();

  const [form, setForm] = useState({
    clinic_name: "",
    clinic_phone: "",
    clinic_address: "",
    currency: "S/",
    appointment_slot_minutes: "30",
  });
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (Object.keys(settings).length) {
      setForm({
        clinic_name: settings.clinic_name ?? "",
        clinic_phone: settings.clinic_phone ?? "",
        clinic_address: settings.clinic_address ?? "",
        currency: settings.currency ?? "S/",
        appointment_slot_minutes: String(
          settings.appointment_slot_minutes ?? 30,
        ),
      });
    }
  }, [settings]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const updates = {
      clinic_name: form.clinic_name,
      clinic_phone: form.clinic_phone,
      clinic_address: form.clinic_address,
      currency: form.currency,
      appointment_slot_minutes: parseInt(form.appointment_slot_minutes) || 30,
    };
    const { error } = await updateMany(updates, profile?.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else
      setFeedback({
        msg: "Configuración guardada correctamente.",
        type: "success",
      });
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="h6" fontWeight={500} mb={3}>
        Configuración del sistema
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Datos de la clínica */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={500} mb={2}>
                  Datos de la clínica
                </Typography>

                {feedback.msg && (
                  <Alert
                    severity={feedback.type}
                    sx={{ mb: 2 }}
                    onClose={() => setFeedback({ msg: "", type: "success" })}
                  >
                    {feedback.msg}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSave} sx={{mt:2}}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Nombre de la clínica"
                        value={form.clinic_name}
                        onChange={set("clinic_name")}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Teléfono"
                        value={form.clinic_phone}
                        onChange={set("clinic_phone")}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Moneda"
                        value={form.currency}
                        onChange={set("currency")}
                        size="small"
                        fullWidth
                        helperText="Símbolo que se mostrará en precios (ej: S/, $, €)"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Dirección"
                        value={form.clinic_address}
                        onChange={set("clinic_address")}
                        size="small"
                        fullWidth
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1 }} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        mb={2}
                      >
                        Agenda
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Duración de slot"
                        type="number"
                        value={form.appointment_slot_minutes}
                        onChange={set("appointment_slot_minutes")}
                        size="small"
                        fullWidth
                        helperText="Duración base de cada cita en el calendario"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                min
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                      >
                        {saving ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Guardar configuración"
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Acciones del odontograma */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={500} mb={1}>
                  Acciones del odontograma
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Los colores y nombres de las acciones se gestionan desde
                  <strong> Catálogo → </strong> tabla{" "}
                  <code>odontogram_actions</code> en Supabase, o puedes agregar
                  una pestaña de acciones en el módulo de Catálogo en el futuro.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Info del sistema */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={500} mb={1.5}>
                  Información del sistema
                </Typography>
                <Grid container spacing={1}>
                  {[
                    ["Versión", "1.0.0"],
                    ["Stack", "React + Supabase + Zustand + MUI"],
                    ["Zona horaria", "America/Lima"],
                    ["Base de datos", "PostgreSQL (Supabase)"],
                  ].map(([k, v]) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={k}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ minWidth: 110 }}
                        >
                          {k}:
                        </Typography>
                        <Typography variant="body2">{v}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
