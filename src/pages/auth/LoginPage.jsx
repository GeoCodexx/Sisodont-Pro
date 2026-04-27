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
//import HealingIcon from "@mui/icons-material/Healing";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

import { supabase } from "../../services/supabaseClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    confirmPassword: "",
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;

      const user = data.user;

      // 2. Obtener perfil
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("active")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Validar estado
      if (!profile.active) {
        // 🚨 usuario inactivo → cerrar sesión
        await supabase.auth.signOut();
        setError("Tu cuenta está inactiva. Contacta al administrador.");
        return;
      }

      // 4. Todo OK
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role: "PATIENT" } },
    });
    if (error) setError(error.message);
    else setSuccess("Revisa tu correo para confirmar tu cuenta.");
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
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
      {/* 🔵 LADO IZQUIERDO (branding) */}
      <Box
        sx={{
          flex: { md: 2 }, // 👈 2 partes
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
          p: 6,
        }}
      >
        <Typography variant="h3" fontWeight={700} mb={2}>
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
        <Box sx={{ mt:3}}>
          <Typography variant="caption">
            Copyright © {new Date().getFullYear()} SISODONT PRO - Geocode.
            Todos los derechos reservados.
          </Typography>
        </Box>
      </Box>

      {/* ⚪ LADO DERECHO (formulario) */}
      <Box
        sx={{
          flex: { md: 1 }, // 👈 1 parte
          minHeight: "100dvh", // 👈 importante (mejor que 100vh en mobile)
          display: "flex",
          justifyContent: "center",
          alignItems: "stretch", // 👈 permite que el hijo crezca
          bgcolor: "background.default",
        }}
      >
        <Card
          elevation={3}
          sx={{
            width: "100%",
            //maxWidth: 420,
            //borderRadius: { xs: 0, md: 3 }, // 👈 sin bordes en mobile (look app)
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            //height: { xs: "100%", md: "auto" }, // 👈 clave
          }}
        >
          <CardContent
            sx={{
              flex: 1, // 👈 ocupa todo el espacio disponible
              display: "flex",
              flexDirection: "column",
              justifyContent: "center", // 👈 centra contenido verticalmente
              p: { xs: 3, md: 4 },
            }}
          >
            {/* Header mobile */}
            <Box mb={3} sx={{ textAlign: "center" }}>
              <MedicalServicesIcon
                sx={{
                  fontSize: 48,
                  color: "primary.main",
                  mb: 1,
                }}
              />

              <Typography variant="h5" fontWeight={600} color="primary">
                Sisodont Pro
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Sistema de gestión odontológica
              </Typography>
            </Box>

            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_, v) => {
                setTab(v);
                setError("");
                setSuccess("");
              }}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab label="Ingresar" />
              <Tab label="Registro" />
              <Tab label="Recuperar" />
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

            {/* LOGIN */}
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

            {/* REGISTER */}
            {tab === 1 && (
              <Box component="form" onSubmit={handleRegister}>
                <TextField
                  label="Nombre completo"
                  value={form.full_name}
                  onChange={set("full_name")}
                  required
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label="Contraseña"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label="Confirmar contraseña"
                  type="password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  required
                  fullWidth
                  margin="normal"
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
                    "Crear cuenta"
                  )}
                </Button>
              </Box>
            )}

            {/* RESET */}
            {tab === 2 && (
              <Box component="form" onSubmit={handleReset}>
                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  fullWidth
                  margin="normal"
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
