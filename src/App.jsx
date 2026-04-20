import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
} from "@mui/material";
import { router } from "./router";
import { lightTheme, darkTheme } from "./theme";
import { useAuthStore } from "./stores/useAuthStore";
import { useThemeStore } from "./stores/useThemeStore";
import { supabase } from "./services/supabaseClient";

export default function App() {
  const { setSession, setProfile, setLoading, loading } = useAuthStore();
  const { darkMode } = useThemeStore();

  /*useEffect(() => {
    // Sesión inicial — setLoading(false) solo después de resolver todo
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) await fetchProfile(session.user.id)
      setLoading(false)
    })

    // Escuchar cambios de sesión (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) await fetchProfile(session.user.id)
        else setProfile(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])*/
  useEffect(() => {
    //let mounted = true;

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("EVENT:", event);

      try {
        setSession(session);

        if (session?.user) {
          console.log("ANTES DE FETCH PROFILE");

          //await fetchProfile(session.user.id);
          fetchProfile(session.user.id); // 🔥 SIN await

          console.log("DESPUÉS DE FETCH PROFILE"); // 👈 ¿esto aparece?
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        console.log("SET LOADING FALSE"); // 👈 ¿esto aparece?
        setLoading(false);
      }
    });

    /* return () => {
      mounted = false;
      subscription.unsubscribe();
    };*/
  }, []);

  /*async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }*/
  /*async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    setProfile(null)
    return
  }

  setProfile(data)
}*/
  async function fetchProfile(userId) {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000),
      );

      const query = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const { data, error } = await Promise.race([query, timeout]);

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        return;
      }

      setProfile(data || null);
    } catch (err) {
      console.error("Fetch profile failed:", err);
      setProfile(null);
    }
  }

  // Bloquear el render del router hasta que la sesión esté resuelta.
  // Esto evita la pantalla en blanco al hacer F5.
  if (loading) {
    return (
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
