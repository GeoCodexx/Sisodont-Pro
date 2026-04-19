import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentIcon from "@mui/icons-material/Payment";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "Pacientes", path: "/patients", icon: <PeopleIcon /> },
  { label: "Citas", path: "/appointments", icon: <CalendarMonthIcon /> },
  { label: "Pagos", path: "/payments", icon: <PaymentIcon /> },
  { label: "Odontograma", path: "/odontogram", icon: <MedicalServicesIcon /> },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuthStore();
  const { darkMode, toggle } = useThemeStore();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: `${DRAWER_WIDTH}px`,
          borderBottom: "0.5px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="body1" fontWeight={500}>
            {NAV_ITEMS.find((i) => location.pathname.startsWith(i.path))
              ?.label ?? "Sisodont Pro"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {profile?.full_name ?? ""}
            </Typography>
            <Tooltip title={darkMode ? "Modo claro" : "Modo oscuro"}>
              <IconButton onClick={toggle} size="small">
                {darkMode ? (
                  <Brightness7Icon fontSize="small" />
                ) : (
                  <Brightness4Icon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Cerrar sesión">
              <IconButton onClick={signOut} size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "0.5px solid",
            borderColor: "divider",
          },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h6" fontWeight={500} color="primary">
            Sisodont Pro
          </Typography>
        </Toolbar>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          {NAV_ITEMS.map(({ label, path, icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(path)}
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                      "& .MuiListItemIcon-root": { color: "white" },
                      "&:hover": { bgcolor: "primary.dark" },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: active ? "white" : "text.secondary",
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        sx: { fontSize: 14, fontWeight: active ? 500 : 400 },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3, mt: 8 }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
