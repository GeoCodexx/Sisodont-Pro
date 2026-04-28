import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  Typography,
} from "@mui/material";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import PageHeader from "../../components/PageHeader";

export default function SettingsPage() {
  const { isMobile } = useBreakpoint();
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
    <Box sx={{ maxWidth: { sm: 680 }, mx: "auto" }}>
      <PageHeader title="Configuración del sistema" />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Datos de la clínica */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 2 }}>
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

                <Box component="form" onSubmit={handleSave}>
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
                        helperText="Símbolo (ej: S/, $, €)"
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
                      <Divider sx={{ my: 0.5 }} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Duración de slot de cita"
                        type="number"
                        value={form.appointment_slot_minutes}
                        onChange={set("appointment_slot_minutes")}
                        size="small"
                        fullWidth
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                min
                              </InputAdornment>
                            ),
                          },
                        }}
                        helperText="Duración base de cada cita en el calendario"
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        fullWidth={isMobile}
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
                <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
                  Acciones del odontograma
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Los colores y nombres se gestionan desde la tabla{" "}
                  <code>odontogram_actions</code> en Supabase, o puedes agregar
                  una pestaña en el Catálogo para gestionarlos desde la app.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Info del sistema */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 500, mb: 1.5 }}
                >
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
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Typography
                          variant="body2"
                          //color="text.secondary"
                          sx={{
                            minWidth: { xs: "auto", sm: 110 },
                            color: "text.secondary",
                          }}
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
