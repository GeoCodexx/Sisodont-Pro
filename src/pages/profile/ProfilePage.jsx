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
  Avatar,
  Divider,
  Chip,
} from "@mui/material";
import { supabase } from "../../services/supabaseClient";
import { useAuthStore } from "../../stores/useAuthStore";

const ROLE_LABELS = {
  ADMIN: "Administrador",
  DOCTOR: "Doctor",
  ASSISTANT: "Asistente",
  PATIENT: "Paciente",
};

const ROLE_COLORS = {
  ADMIN: "error",
  DOCTOR: "primary",
  ASSISTANT: "warning",
  PATIENT: "default",
};

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { profile, setProfile } = useAuthStore();

  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [feedbackPw, setFeedbackPw] = useState({ msg: "", type: "success" });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const setPw = (f) => (e) => setPwForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setFeedback({ msg: "El nombre es obligatorio.", type: "error" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) setFeedback({ msg: error.message, type: "error" });
    else {
      setProfile(data);
      setFeedback({
        msg: "Perfil actualizado correctamente.",
        type: "success",
      });
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.password.length < 6) {
      setFeedbackPw({
        msg: "La contraseña debe tener al menos 6 caracteres.",
        type: "error",
      });
      return;
    }
    if (pwForm.password !== pwForm.confirm) {
      setFeedbackPw({ msg: "Las contraseñas no coinciden.", type: "error" });
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({
      password: pwForm.password,
    });
    if (error) setFeedbackPw({ msg: error.message, type: "error" });
    else {
      setFeedbackPw({
        msg: "Contraseña actualizada correctamente.",
        type: "success",
      });
      setPwForm({ password: "", confirm: "" });
    }
    setSavingPw(false);
  };

  if (!profile) return null;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="h6" fontWeight={500} mb={3}>
        Mi perfil
      </Typography>

      <Grid container spacing={3}>
        {/* Tarjeta de resumen */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "primary.main",
                  fontSize: 28,
                }}
              >
                {initials(profile.full_name)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={500}>
                  {profile.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {profile.email}
                </Typography>
                <Chip
                  label={ROLE_LABELS[profile.role] ?? profile.role}
                  color={ROLE_COLORS[profile.role] ?? "default"}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Editar datos personales */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={500} mb={2}>
                Datos personales
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

              <Box component="form" onSubmit={handleSaveProfile}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nombre completo"
                      value={form.full_name}
                      onChange={set("full_name")}
                      size="small"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
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
                      value={profile.email ?? ""}
                      size="small"
                      fullWidth
                      disabled
                      helperText="El correo no puede modificarse desde aquí"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Rol"
                      value={ROLE_LABELS[profile.role] ?? profile.role}
                      size="small"
                      fullWidth
                      disabled
                      helperText="El rol es asignado por el administrador"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cambiar contraseña */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={500} mb={2}>
                Cambiar contraseña
              </Typography>

              {feedbackPw.msg && (
                <Alert
                  severity={feedbackPw.type}
                  sx={{ mb: 2 }}
                  onClose={() => setFeedbackPw({ msg: "", type: "success" })}
                >
                  {feedbackPw.msg}
                </Alert>
              )}

              <Box component="form" onSubmit={handleChangePassword}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nueva contraseña"
                      type="password"
                      value={pwForm.password}
                      onChange={setPw("password")}
                      size="small"
                      fullWidth
                      helperText="Mínimo 6 caracteres"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Confirmar contraseña"
                      type="password"
                      value={pwForm.confirm}
                      onChange={setPw("confirm")}
                      size="small"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      variant="outlined"
                      disabled={savingPw}
                    >
                      {savingPw ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Cambiar contraseña"
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
