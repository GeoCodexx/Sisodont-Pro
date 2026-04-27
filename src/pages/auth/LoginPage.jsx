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

  /*const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (error) setError(error.message)
    else navigate('/')
    setLoading(false)
  }*/
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
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={500} mb={0.5} color="primary">
            Sisodont Pro
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sistema de gestión odontológica
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setError("");
              setSuccess("");
            }}
            sx={{ mb: 3 }}
          >
            <Tab label="Ingresar" />
            <Tab label="Registrarse" />
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

          {tab === 0 && (
            <Box
              component="form"
              onSubmit={handleLogin}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                fullWidth
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Ingresar"
                )}
              </Button>
            </Box>
          )}

          {tab === 1 && (
            <Box
              component="form"
              onSubmit={handleRegister}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Nombre completo"
                value={form.full_name}
                onChange={set("full_name")}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                required
                fullWidth
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </Box>
          )}

          {tab === 2 && (
            <Box
              component="form"
              onSubmit={handleReset}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                fullWidth
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Enviar enlace"
                )}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
