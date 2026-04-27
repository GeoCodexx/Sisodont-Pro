import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { Box, CircularProgress } from "@mui/material";
import { supabase } from "../services/supabaseClient";

/*export function ProtectedRoute({ children }) {
  const { session, loading } = useAuthStore();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}*/

export const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const { signOut } = useAuthStore();

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // ❌ No logueado
      if (!user) {
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      // 🔍 Obtener perfil
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("active")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        signOut();
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      // 🚨 Usuario inactivo
      if (!profile.active) {
        signOut();
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      // ✅ Todo OK
      setIsAllowed(true);
      setLoading(false);
    };

    checkAccess();
  }, []);

  if (loading) {
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

  if (!isAllowed) return <Navigate to="/login" replace />;

  return children;
};

export function RoleRoute({ children, allowed = [] }) {
  const { profile, loading } = useAuthStore();
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  //console.log("Profile role: ", profile?.role);
  if (!allowed.includes(profile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
