import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute, RoleRoute } from "../components/RoleRoute";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/auth/LoginPage";
import UsersPage from "../pages/auth/UsersPage";
import PatientsPage from "../pages/patients/PatientsPage";
import PatientDetailPage from "../pages/patients/PatientDetailPage";
import CatalogPage from "../pages/catalog/CatalogPage";

const Placeholder = ({ title }) => (
  <div style={{ padding: 32 }}>
    <h2>{title}</h2>
    <p style={{ color: "#888", marginTop: 8 }}>Módulo en construcción...</p>
  </div>
);

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Placeholder title="Dashboard" /> },
      {
        path: "users",
        element: (
          <RoleRoute allowed={["ADMIN"]}>
            <UsersPage />
          </RoleRoute>
        ),
      },
      {
        path: "patients",
        element: (
          <RoleRoute allowed={["ADMIN", "DOCTOR", "ASSISTANT"]}>
            <PatientsPage />
          </RoleRoute>
        ),
      },
      {
        path: "patients/:id",
        element: (
          <RoleRoute allowed={["ADMIN", "DOCTOR", "ASSISTANT"]}>
            <PatientDetailPage />
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
      { path: "appointments", element: <Placeholder title="Citas" /> },
      { path: "payments", element: <Placeholder title="Pagos" /> },
      { path: "odontogram", element: <Placeholder title="Odontograma" /> },
      { path: "profile", element: <Placeholder title="Mi perfil" /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
