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
import ProfilePage       from '../pages/profile/ProfilePage'
import SettingsPage      from '../pages/settings/SettingsPage'

const STAFF = ['ADMIN', 'DOCTOR', 'ASSISTANT']
const ALL   = ['ADMIN', 'DOCTOR', 'ASSISTANT', 'PATIENT']

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
      { path: 'odontogram',   element: <RoleRoute allowed={STAFF}><OdontogramPage /></RoleRoute> },
      { path: 'profile',      element: <RoleRoute allowed={ALL}><ProfilePage /></RoleRoute> },
      { path: 'settings',     element: <RoleRoute allowed={['ADMIN']}><SettingsPage /></RoleRoute> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])