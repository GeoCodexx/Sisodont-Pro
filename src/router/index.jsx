import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

import MainLayout from '../layouts/MainLayout'
import LoginPage from '../pages/auth/LoginPage'

// Placeholders — se reemplazarán en cada fase
const Placeholder = ({ title }) => (
  <div style={{ padding: 32 }}>
    <h2>{title}</h2>
    <p style={{ color: '#888', marginTop: 8 }}>Módulo en construcción...</p>
  </div>
)

function ProtectedRoute({ children }) {
  const { session, loading } = useAuthStore()
  if (loading) return null
  //if (!session) return <Navigate to="/login" replace />
  return children
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Placeholder title="Dashboard" /> },
      { path: 'patients', element: <Placeholder title="Pacientes" /> },
      { path: 'appointments', element: <Placeholder title="Citas" /> },
      { path: 'payments', element: <Placeholder title="Pagos" /> },
      { path: 'odontogram', element: <Placeholder title="Odontograma" /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])