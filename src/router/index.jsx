import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute, RoleRoute } from '../components/RoleRoute'
import MainLayout        from '../layouts/MainLayout'
import LoginPage         from '../pages/auth/LoginPage'
import UsersPage         from '../pages/auth/UsersPage'
import PatientsPage      from '../pages/patients/PatientsPage'
import PatientDetailPage from '../pages/patients/PatientDetailPage'
import CatalogPage       from '../pages/catalog/CatalogPage'
import AppointmentsPage  from '../pages/appointments/AppointmentsPage'
import PaymentsPage      from '../pages/payments/PaymentsPage'
import HistoryPage       from '../pages/history/HistoryPage'
import DashboardPage     from '../pages/dashboard/DashboardPage'
import OdontogramPage    from '../pages/odontogram/OdontogramPage'

const Placeholder = ({ title }) => (
  <div style={{ padding: 32 }}>
    <h2>{title}</h2>
    <p style={{ color: '#888', marginTop: 8 }}>Módulo en construcción...</p>
  </div>
)

const STAFF = ['ADMIN', 'DOCTOR', 'ASSISTANT']

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true,          element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',    element: <RoleRoute allowed={STAFF}><DashboardPage /></RoleRoute> },
      { path: 'users',        element: <RoleRoute allowed={['ADMIN']}><UsersPage /></RoleRoute> },
      { path: 'catalog',      element: <RoleRoute allowed={['ADMIN']}><CatalogPage /></RoleRoute> },
      { path: 'patients',     element: <RoleRoute allowed={STAFF}><PatientsPage /></RoleRoute> },
      { path: 'patients/:id', element: <RoleRoute allowed={STAFF}><PatientDetailPage /></RoleRoute> },
      { path: 'appointments', element: <RoleRoute allowed={STAFF}><AppointmentsPage /></RoleRoute> },
      { path: 'payments',     element: <RoleRoute allowed={STAFF}><PaymentsPage /></RoleRoute> },
      { path: 'history',      element: <RoleRoute allowed={STAFF}><HistoryPage /></RoleRoute> },
      { path: 'odontogram',   element: <RoleRoute allowed={['ADMIN','DOCTOR','ASSISTANT']}><OdontogramPage /></RoleRoute> },
      { path: 'profile',      element: <Placeholder title="Mi perfil" /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])