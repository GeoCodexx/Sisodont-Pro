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
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentIcon from "@mui/icons-material/Payment";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";

const DRAWER_WIDTH = 224;

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
  },
  {
    label: "Usuarios",
    path: "/users",
    icon: <AdminPanelSettingsIcon />,
    roles: ["ADMIN"],
  },
  {
    label: "Catálogo",
    path: "/catalog",
    icon: <LocalHospitalIcon />,
    roles: ["ADMIN"],
  },
  {
    label: "Pacientes",
    path: "/patients",
    icon: <PeopleIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
  },
  {
    label: "Citas",
    path: "/appointments",
    icon: <CalendarMonthIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
  },
  {
    label: "Pagos",
    path: "/payments",
    icon: <PaymentIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
  },
  {
    label: "Historial",
    path: "/history",
    icon: <HistoryIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
  },
  {
    label: "Odontograma",
    path: "/odontogram",
    icon: <MedicalServicesIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
  },
  {
    label: "Mi perfil",
    path: "/profile",
    icon: <PersonIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT", "PATIENT"],
  },
  {
    label: "Configuración",
    path: "/settings",
    icon: <SettingsIcon />,
    roles: ["ADMIN"],
  },
];

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Contenido interno del sidebar (compartido entre drawer móvil y drawer permanente)
function SidebarContent({
  visibleItems,
  location,
  navigate,
  profile,
  onItemClick,
}) {
  const mainItems = visibleItems.filter((i) => i.path !== "/settings");
  const settingsItem = visibleItems.find((i) => i.path === "/settings");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ px: 2, gap: 1.5, minHeight: { xs: 56, sm: 64 } }}>
        <Avatar
          sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: 12 }}
        >
          {initials(profile?.full_name)}
        </Avatar>
        <Typography variant="body1" fontWeight={500} color="primary">
          Sisodont Pro
        </Typography>
      </Toolbar>
      <Divider />

      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {mainItems.map(({ label, path, icon }) => {
          const active = location.pathname.startsWith(path);
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(path);
                  onItemClick?.();
                }}
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
                  //primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 500 : 400 }}
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

      {/* Configuración anclada al fondo */}
      {settingsItem && (
        <>
          <Divider sx={{ mx: 1 }} />
          <List sx={{ px: 1, pb: 1 }}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate("/settings");
                  onItemClick?.();
                }}
                selected={location.pathname.startsWith("/settings")}
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
                    color: location.pathname.startsWith("/settings")
                      ? "white"
                      : "text.secondary",
                  }}
                >
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Configuración"
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: location.pathname.startsWith("/settings")
                          ? 500
                          : 400,
                      },
                    },
                  }}
                  /*primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: location.pathname.startsWith("/settings")
                      ? 500
                      : 400,
                  }}*/
                />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuthStore();
  const { darkMode, toggle } = useThemeStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((i) => i.roles.includes(profile?.role));
  const activeLabel =
    visibleItems.find((i) => location.pathname.startsWith(i.path))?.label ??
    "Sisodont Pro";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: "0.5px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          color: "text.primary",
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Hamburger solo en móvil */}
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                size="small"
                edge="start"
                sx={{ mr: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="body1" fontWeight={500} noWrap>
              {activeLabel}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" }, mr: 0.5 }}
              noWrap
            >
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

      {/* Drawer móvil — temporal, se abre con hamburger */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "0.5px solid",
            borderColor: "divider",
          },
        }}
      >
        <SidebarContent
          visibleItems={visibleItems}
          location={location}
          navigate={navigate}
          profile={profile}
          onItemClick={() => setMobileOpen(false)}
        />
      </Drawer>

      {/* Drawer desktop — permanente */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "0.5px solid",
            borderColor: "divider",
          },
        }}
        open
      >
        <SidebarContent
          visibleItems={visibleItems}
          location={location}
          navigate={navigate}
          profile={profile}
        />
      </Drawer>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: { xs: 2, sm: 3 },
          mt: { xs: "56px", sm: "64px" },
          minWidth: 0, // evita overflow horizontal
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
