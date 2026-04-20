import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuthStore();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function RoleRoute({ children, allowed = [] }) {
  const { profile, loading } = useAuthStore();
  if (loading) return null;
  console.log("Profile role: ", profile?.role);
  if (!allowed.includes(profile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
