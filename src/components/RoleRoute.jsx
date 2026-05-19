import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuthStore } from "../stores/useAuthStore";

// ─────────────────────────────────────────────────────────────
// REGLA DE ORO
// Ningún guard hace fetch propio.
// Todo se lee desde useAuthStore.
// El store ya validó `active` al cargar el perfil.
// ─────────────────────────────────────────────────────────────

// ── Spinner reutilizable ─────────────────────────────────────
function FullScreenSpinner() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

// ── ProtectedRoute ───────────────────────────────────────────
// Verifica únicamente que haya una sesión activa.
// La validación de `active` ya ocurrió en fetchProfile.
// No hace ningún fetch propio.
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) return <FullScreenSpinner />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

// ── RoleRoute ────────────────────────────────────────────────
// Verifica que el rol del usuario esté en la lista `allowed`.
// Si el rol no está permitido, redirige a su home según rol.
export function RoleRoute({ children, allowed = [] }) {
  const { role, isSuperAdmin, loading } = useAuthStore();

  if (loading) return <FullScreenSpinner />;

  // SUPER_ADMIN tiene bypass global a rutas de staff.
  // Sus rutas exclusivas usan SuperAdminRoute.
  if (isSuperAdmin) return children;

  if (!allowed.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return children;
}

// ── SuperAdminRoute ──────────────────────────────────────────
// Solo permite acceso a usuarios con rol SUPER_ADMIN.
// Usado exclusivamente para rutas /super-admin/*
export function SuperAdminRoute({ children }) {
  const { isSuperAdmin, isAuthenticated, loading } = useAuthStore();

  if (loading) return <FullScreenSpinner />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

// ─────────────────────────────────────────────────────────────
// getRoleHome
// Devuelve la ruta principal según el rol del usuario.
// Usado para redirects inteligentes post-login y en RoleRoute.
// ─────────────────────────────────────────────────────────────
export function getRoleHome(role) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "ADMIN":
      return "/dashboard";
    case "DOCTOR":
      return "/dashboard";
    case "ASSISTANT":
      return "/dashboard";
    case "PATIENT":
      return "/my-appointments";
    default:
      return "/dashboard";
  }
}
