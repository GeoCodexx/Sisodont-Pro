import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
} from "@mui/material";
import { router }        from "./router";
import { lightTheme, darkTheme } from "./theme";
import { useAuthStore }  from "./stores/useAuthStore";
import { useThemeStore } from "./stores/useThemeStore";
import GlobalSnackbar from "./components/GlobalSnackbar";

export default function App() {
  const initAuthListener = useAuthStore((s) => s.initAuthListener);
  const loading          = useAuthStore((s) => s.loading);
  const { darkMode }     = useThemeStore();

  useEffect(() => {
    initAuthListener();
    // initAuthListener tiene su propio guard interno
    // (if authListener return) así que es seguro
    // aunque React llame al efecto dos veces en StrictMode.
  }, [initAuthListener]);

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
      <GlobalSnackbar />
    </ThemeProvider>
  );
}