import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

import { supabase } from "../../services/supabaseClient";
import { useAuthStore } from "../../stores/useAuthStore";
import { getRoleHome } from "../../components/RoleRoute";

// ─────────────────────────────────────────────────────────────
// Tabs disponibles
// Se elimina "Registro" porque en un SaaS multi-tenant
// los usuarios los crea el ADMIN desde el panel,
// no mediante auto-registro público.
// ─────────────────────────────────────────────────────────────
const TABS = ["Ingresar", "Recuperar contraseña"];

export default function LoginPage() {
  const navigate = useNavigate();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ email: "", password: "" });
  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ── Login ───────────────────────────────────────────────
  // No hacemos fetch propio del perfil aquí.
  // onAuthStateChange del store dispara fetchProfile
  // automáticamente cuando Supabase emite SIGNED_IN.
  // Nosotros solo esperamos a que el store termine
  // y luego leemos el role para el redirect.
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

      if (signInError) throw signInError;

      // fetchProfile valida `active` internamente.
      // Si el usuario está inactivo, llama a signOut()
      // y setProfile(null), por lo que role quedará null.
      await fetchProfile(data.user.id);

      // Leer el role actualizado directamente del store
      const role = useAuthStore.getState().role;

      if (!role) {
        // fetchProfile encontró el usuario inactivo
        // y ya cerró la sesión
        setError("Tu cuenta está inactiva. Contacta al administrador.");
        return;
      }

      // Redirect inteligente según rol
      navigate(getRoleHome(role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperar contraseña ────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      form.email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

    if (resetError) setError(resetError.message);
    else setSuccess("Te enviamos un enlace para restablecer tu contraseña.");

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* Branding — solo desktop ───────────────────────── */}
      <Box
        sx={{
          flex: { md: 2 },
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
          p: 6,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          SISODONT PRO
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, textAlign: "center" }}>
          Gestión odontológica moderna, eficiente y segura
        </Typography>
        <Box mt={6}>
          <Typography variant="body2">
            Control de pacientes · Citas · Pagos · Historial clínico
          </Typography>
        </Box>
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption">
            Copyright © {new Date().getFullYear()} SISODONT PRO - Geocode. Todos
            los derechos reservados.
          </Typography>
        </Box>
      </Box>

      {/* Formulario ─────────────────────────────────────── */}
      <Box
        sx={{
          flex: { md: 1 },
          minHeight: "100dvh",
          display: "flex",
          justifyContent: "center",
          alignItems: "stretch",
          bgcolor: "background.default",
        }}
      >
        <Card
          elevation={3}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <CardContent
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: { xs: 3, md: 4 },
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <MedicalServicesIcon
                sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
              />
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "primary" }}
              >
                Sisodont Pro
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Sistema de gestión odontológica
              </Typography>
            </Box>

            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_, v) => {
                setTab(v);
                clearMessages();
              }}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              {TABS.map((label) => (
                <Tab key={label} label={label} />
              ))}
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* Tab 0: Login */}
            {tab === 0 && (
              <Box component="form" onSubmit={handleLogin}>
                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  fullWidth
                  margin="normal"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    },
                  }}
                />
                <TextField
                  label="Contraseña"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  fullWidth
                  margin="normal"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <LockIcon sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2, py: 1.2 }}
                >
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </Box>
            )}

            {/* Tab 1: Recuperar contraseña */}
            {tab === 1 && (
              <Box component="form" onSubmit={handleReset}>
                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  fullWidth
                  margin="normal"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2, py: 1.2 }}
                >
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "Enviar enlace"
                  )}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
