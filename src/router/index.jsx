import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

import {
  ProtectedRoute,
  RoleRoute,
  SuperAdminRoute,
  getRoleHome,
} from "../components/RoleRoute";

import { useAuthStore } from "../stores/useAuthStore";

// ── Layouts ───────────────────────────────────────────────────
import MainLayout from "../layouts/MainLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

// ── Loader global ─────────────────────────────────────────────
import { Box, CircularProgress, Button, Typography } from "@mui/material";

// ── Lazy Pages ────────────────────────────────────────────────

// Auth
const LoginPage = lazy(
  () => import(/* webpackChunkName: "login" */ "../pages/auth/LoginPage"),
);
const UsersPage = lazy(
  () => import(/* webpackChunkName: "users" */ "../pages/auth/UsersPage"),
);

// Clínica
const PatientsPage = lazy(
  () =>
    import(/* webpackChunkName: "patients" */ "../pages/patients/PatientsPage"),
);
const PatientDetailPage = lazy(
  () =>
    import(
      /* webpackChunkName: "patients" */ "../pages/patients/PatientDetailPage"
    ),
);
const AppointmentsPage = lazy(
  () =>
    import(
      /* webpackChunkName: "appointments" */ "../pages/appointments/AppointmentsPage"
    ),
);
const OdontogramPage = lazy(
  () =>
    import(
      /* webpackChunkName: "odontogram" */ "../pages/odontogram/OdontogramPage"
    ),
);
const HistoryPage = lazy(
  () =>
    import(/* webpackChunkName: "history" */ "../pages/history/HistoryPage"),
);

// Finanzas
const PaymentsPage = lazy(
  () =>
    import(/* webpackChunkName: "payments" */ "../pages/payments/PaymentsPage"),
);

// Config
const CatalogPage = lazy(
  () =>
    import(/* webpackChunkName: "catalog" */ "../pages/catalog/CatalogPage"),
);
const SettingsPage = lazy(
  () =>
    import(/* webpackChunkName: "settings" */ "../pages/settings/SettingsPage"),
);
const ProfilePage = lazy(
  () =>
    import(/* webpackChunkName: "profile" */ "../pages/profile/ProfilePage"),
);

// Dashboard
const DashboardPage = lazy(
  () =>
    import(
      /* webpackChunkName: "dashboard" */ "../pages/dashboard/DashboardPage"
    ),
);
const MyAppointmentsPage = lazy(
  () =>
    import(
      /* webpackChunkName: "my-appointments" */ "../pages/my-appointments/MyAppointmentsPage"
    ),
);

// Super Admin
const SuperAdminDashboard = lazy(
  () =>
    import(
      /* webpackChunkName: "super-admin" */ "../pages/super-admin/SuperAdminDashboard"
    ),
);
const TenantDetailPage = lazy(
  () =>
    import(
      /* webpackChunkName: "super-admin" */ "../pages/super-admin/TenantDetailPage"
    ),
);
const SuperAdminCatalogPage = lazy(
  () =>
    import(
      /* webpackChunkName: "super-admin" */ "../pages/super-admin/SuperAdminCatalogPage"
    ),
);

// ─────────────────────────────────────────────────────────────
// Preloaders — úsalos en hover o idle para anticipar navegación
// ─────────────────────────────────────────────────────────────
export const preloadRoutes = {
  dashboard: () =>
    import(
      /* webpackChunkName: "dashboard" */ "../pages/dashboard/DashboardPage"
    ),
  patients: () =>
    import(/* webpackChunkName: "patients" */ "../pages/patients/PatientsPage"),
  appointments: () =>
    import(
      /* webpackChunkName: "appointments" */ "../pages/appointments/AppointmentsPage"
    ),
  payments: () =>
    import(/* webpackChunkName: "payments" */ "../pages/payments/PaymentsPage"),
  myAppointments: () =>
    import(
      /* webpackChunkName: "my-appointments" */ "../pages/my-appointments/MyAppointmentsPage"
    ),
};

// ─────────────────────────────────────────────────────────────
// PageLoader
// ─────────────────────────────────────────────────────────────
// function PageLoader() {
//   return (
//     <Box
//       sx={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         height: "100vh",
//       }}
//     >
//       <CircularProgress />
//     </Box>
//   );
// }
function PageLoader() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        width: "100%",
      }}
    >
      <CircularProgress size={32} thickness={3} />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// ChunkErrorFallback — mostrado si el chunk falla al cargar
// ─────────────────────────────────────────────────────────────
function ChunkErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        height: "100vh",
        px: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="h6">No se pudo cargar esta página</Typography>
      <Typography variant="body2" color="text.secondary">
        {error?.message ?? "Error al cargar el módulo. Verifica tu conexión."}
      </Typography>
      <Button variant="contained" onClick={resetErrorBoundary}>
        Reintentar
      </Button>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Loadable — Suspense + ErrorBoundary reutilizable
// ─────────────────────────────────────────────────────────────
function Loadable({ children }) {
  return (
    <ErrorBoundary FallbackComponent={ChunkErrorFallback}>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// ─────────────────────────────────────────────────────────────
// Grupos de roles
// ─────────────────────────────────────────────────────────────
const STAFF = ["ADMIN", "DOCTOR", "ASSISTANT"];
const ALL = ["ADMIN", "DOCTOR", "ASSISTANT", "PATIENT"];

// ─────────────────────────────────────────────────────────────
// RootRedirect — separado para evitar llamadas de hook en render
// ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const role = useAuthStore((s) => s.role);
  return <Navigate to={getRoleHome(role)} replace />;
}

// ─────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Pública ───────────────────────────────────────────────
  {
    path: "/login",
    element: (
      <Loadable>
        <LoginPage />
      </Loadable>
    ),
  },

  // ── Super Admin ───────────────────────────────────────────
  {
    path: "/super-admin",
    element: (
      <SuperAdminRoute>
        <SuperAdminLayout />
      </SuperAdminRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Loadable>
            <SuperAdminDashboard />
          </Loadable>
        ),
      },
      {
        path: "tenants/:id",
        element: (
          <Loadable>
            <TenantDetailPage />
          </Loadable>
        ),
      },
      {
        path: "catalog",
        element: (
          <Loadable>
            <SuperAdminCatalogPage />
          </Loadable>
        ),
      },
    ],
  },

  // ── App clínica ───────────────────────────────────────────
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RootRedirect /> },

      {
        path: "dashboard",
        element: (
          <RoleRoute allowed={STAFF}>
            <Loadable>
              <DashboardPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "users",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <Loadable>
              <UsersPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "catalog",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <Loadable>
              <CatalogPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "patients",
        element: (
          <RoleRoute allowed={STAFF}>
            <Loadable>
              <PatientsPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "patients/:id",
        element: (
          <RoleRoute allowed={STAFF}>
            <Loadable>
              <PatientDetailPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "appointments",
        element: (
          <RoleRoute allowed={STAFF}>
            <Loadable>
              <AppointmentsPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "my-appointments",
        element: (
          <RoleRoute allowed={["PATIENT"]}>
            <Loadable>
              <MyAppointmentsPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "payments",
        element: (
          <RoleRoute allowed={STAFF}>
            <Loadable>
              <PaymentsPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "history",
        element: (
          <RoleRoute allowed={STAFF}>
            <Loadable>
              <HistoryPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "odontogram",
        element: (
          <RoleRoute allowed={[...STAFF, "PATIENT"]}>
            <Loadable>
              <OdontogramPage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "profile",
        element: (
          <RoleRoute allowed={ALL}>
            <Loadable>
              <ProfilePage />
            </Loadable>
          </RoleRoute>
        ),
      },

      {
        path: "settings",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <Loadable>
              <SettingsPage />
            </Loadable>
          </RoleRoute>
        ),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
