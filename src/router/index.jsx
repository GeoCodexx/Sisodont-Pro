import { createBrowserRouter, Navigate } from "react-router-dom";
import {
  ProtectedRoute,
  RoleRoute,
  SuperAdminRoute,
  getRoleHome,
} from "../components/RoleRoute";

// ── Layouts ──────────────────────────────────────────────────
import MainLayout from "../layouts/MainLayout";
// TODO Módulo 3: crear SuperAdminLayout
// import SuperAdminLayout from "../layouts/SuperAdminLayout";

// ── Pages: Auth ──────────────────────────────────────────────
import LoginPage from "../pages/auth/LoginPage";
import UsersPage from "../pages/auth/UsersPage";

// ── Pages: Clínicas ──────────────────────────────────────────
import PatientsPage from "../pages/patients/PatientsPage";
import PatientDetailPage from "../pages/patients/PatientDetailPage";
import AppointmentsPage from "../pages/appointments/AppointmentsPage";
import OdontogramPage from "../pages/odontogram/OdontogramPage";
import HistoryPage from "../pages/history/HistoryPage";

// ── Pages: Finanzas ──────────────────────────────────────────
import PaymentsPage from "../pages/payments/PaymentsPage";

// ── Pages: Config ────────────────────────────────────────────
import CatalogPage from "../pages/catalog/CatalogPage";
import SettingsPage from "../pages/settings/SettingsPage";
import ProfilePage from "../pages/profile/ProfilePage";

// ── Pages: Dashboard ─────────────────────────────────────────
import DashboardPage from "../pages/dashboard/DashboardPage";

// ── Pages: Super Admin (TODO Módulo 4) ───────────────────────
// import SuperAdminDashboard from "../pages/super-admin/SuperAdminDashboard";
// import TenantsPage        from "../pages/super-admin/TenantsPage";
// import TenantDetailPage   from "../pages/super-admin/TenantDetailPage";

// ─────────────────────────────────────────────────────────────
// Grupos de roles reutilizables
// ─────────────────────────────────────────────────────────────
const STAFF = ["ADMIN", "DOCTOR", "ASSISTANT"];
const ALL = ["ADMIN", "DOCTOR", "ASSISTANT", "PATIENT"];

// ─────────────────────────────────────────────────────────────
// Redirect raíz inteligente
// Lee el role del store para redirigir al home correcto.
// Se usa en { index: true } de la ruta raíz.
// ─────────────────────────────────────────────────────────────
import { useAuthStore } from "../stores/useAuthStore";

function RootRedirect() {
  const { role } = useAuthStore();
  return <Navigate to={getRoleHome(role)} replace />;
}

// ─────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Pública ──────────────────────────────────────────────
  {
    path: "/login",
    element: <LoginPage />,
  },

  // ── App principal (staff + patient) ──────────────────────
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Redirect inteligente según rol
      {
        index: true,
        element: <RootRedirect />,
      },

      // Dashboard (staff)
      {
        path: "dashboard",
        element: (
          <RoleRoute allowed={STAFF}>
            <DashboardPage />
          </RoleRoute>
        ),
      },

      // Usuarios — solo ADMIN
      {
        path: "users",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <UsersPage />
          </RoleRoute>
        ),
      },

      // Catálogo — solo ADMIN
      {
        path: "catalog",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <CatalogPage />
          </RoleRoute>
        ),
      },

      // Pacientes
      {
        path: "patients",
        element: (
          <RoleRoute allowed={STAFF}>
            <PatientsPage />
          </RoleRoute>
        ),
      },
      {
        path: "patients/:id",
        element: (
          <RoleRoute allowed={STAFF}>
            <PatientDetailPage />
          </RoleRoute>
        ),
      },

      // Citas
      {
        path: "appointments",
        element: (
          <RoleRoute allowed={STAFF}>
            <AppointmentsPage />
          </RoleRoute>
        ),
      },

      // Pagos
      {
        path: "payments",
        element: (
          <RoleRoute allowed={STAFF}>
            <PaymentsPage />
          </RoleRoute>
        ),
      },

      // Historial
      {
        path: "history",
        element: (
          <RoleRoute allowed={STAFF}>
            <HistoryPage />
          </RoleRoute>
        ),
      },

      // Odontograma
      {
        path: "odontogram",
        element: (
          <RoleRoute allowed={STAFF}>
            <OdontogramPage />
          </RoleRoute>
        ),
      },

      // Perfil — todos los roles
      {
        path: "profile",
        element: (
          <RoleRoute allowed={ALL}>
            <ProfilePage />
          </RoleRoute>
        ),
      },

      // Configuración — solo ADMIN
      {
        path: "settings",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <SettingsPage />
          </RoleRoute>
        ),
      },

      // Vista paciente: sus citas (TODO Módulo 4)
      // {
      //   path: "my-appointments",
      //   element: (
      //     <RoleRoute allowed={["PATIENT"]}>
      //       <MyAppointmentsPage />
      //     </RoleRoute>
      //   ),
      // },
    ],
  },

  // ── Super Admin (módulo independiente) ───────────────────
  // TODO Módulo 4: descomentar cuando existan las páginas
  // {
  //   path: "/super-admin",
  //   element: (
  //     <SuperAdminRoute>
  //       <SuperAdminLayout />
  //     </SuperAdminRoute>
  //   ),
  //   children: [
  //     { index: true,             element: <SuperAdminDashboard /> },
  //     { path: "tenants",         element: <TenantsPage /> },
  //     { path: "tenants/:id",     element: <TenantDetailPage /> },
  //   ],
  // },

  // ── Fallback ──────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
