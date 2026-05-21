import { createBrowserRouter, Navigate } from "react-router-dom";
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

// ── Auth ──────────────────────────────────────────────────────
import LoginPage from "../pages/auth/LoginPage";
import UsersPage from "../pages/auth/UsersPage";

// ── Clínica ───────────────────────────────────────────────────
import PatientsPage from "../pages/patients/PatientsPage";
import PatientDetailPage from "../pages/patients/PatientDetailPage";
import AppointmentsPage from "../pages/appointments/AppointmentsPage";
import OdontogramPage from "../pages/odontogram/OdontogramPage";
import HistoryPage from "../pages/history/HistoryPage";

// ── Finanzas ──────────────────────────────────────────────────
import PaymentsPage from "../pages/payments/PaymentsPage";

// ── Config ────────────────────────────────────────────────────
import CatalogPage from "../pages/catalog/CatalogPage";
import SettingsPage from "../pages/settings/SettingsPage";
import ProfilePage from "../pages/profile/ProfilePage";

// ── Dashboard ─────────────────────────────────────────────────
import DashboardPage from "../pages/dashboard/DashboardPage";
import MyAppointmentsPage from "../pages/my-appointments/MyAppointmentsPage";

// ── Super Admin ───────────────────────────────────────────────
import SuperAdminDashboard from "../pages/super-admin/SuperAdminDashboard";
import TenantDetailPage from "../pages/super-admin/TenantDetailPage";
import SuperAdminCatalogPage from "../pages/super-admin/SuperAdminCatalogPage";

// ─────────────────────────────────────────────────────────────
// Grupos de roles
// ─────────────────────────────────────────────────────────────
const STAFF = ["ADMIN", "DOCTOR", "ASSISTANT"];
const ALL = ["ADMIN", "DOCTOR", "ASSISTANT", "PATIENT"];

// ─────────────────────────────────────────────────────────────
// RootRedirect — redirige según rol, nunca hardcodea /dashboard
// ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const role = useAuthStore((s) => s.role);
  return <Navigate to={getRoleHome(role)} replace />;
}

export const router = createBrowserRouter([
  // ── Pública ───────────────────────────────────────────────
  { path: "/login", element: <LoginPage /> },

  // ── Super Admin ───────────────────────────────────────────
  {
    path: "/super-admin",
    element: (
      <SuperAdminRoute>
        <SuperAdminLayout />
      </SuperAdminRoute>
    ),
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: "tenants/:id", element: <TenantDetailPage /> },
      { path: "catalog", element: <SuperAdminCatalogPage /> },
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
            <DashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: "users",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <UsersPage />
          </RoleRoute>
        ),
      },
      {
        path: "catalog",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <CatalogPage />
          </RoleRoute>
        ),
      },
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
      {
        path: "appointments",
        element: (
          <RoleRoute allowed={STAFF}>
            <AppointmentsPage />
          </RoleRoute>
        ),
      },
      {
        path: "my-appointments",
        element: (
          <RoleRoute allowed={["PATIENT"]}>
            <MyAppointmentsPage />
          </RoleRoute>
        ),
      },
      {
        path: "payments",
        element: (
          <RoleRoute allowed={STAFF}>
            <PaymentsPage />
          </RoleRoute>
        ),
      },
      {
        path: "history",
        element: (
          <RoleRoute allowed={STAFF}>
            <HistoryPage />
          </RoleRoute>
        ),
      },
      {
        path: "odontogram",
        element: (
          <RoleRoute allowed={[...STAFF, "PATIENT"]}>
            <OdontogramPage />
          </RoleRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <RoleRoute allowed={ALL}>
            <ProfilePage />
          </RoleRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <SettingsPage />
          </RoleRoute>
        ),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
]);
