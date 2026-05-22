import { useState, useCallback } from "react";
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
  Chip,
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
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";

import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";
import { preloadRoutes } from "../router";

const DRAWER_WIDTH = 224;

// ─────────────────────────────────────────────────────────────
// Definición de ítems de navegación por rol.
// preload: función del objeto preloadRoutes correspondiente.
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  // ── Staff ──────────────────────────────────────────────────
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
    preload: "dashboard",
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
    preload: "patients",
  },
  {
    label: "Citas",
    path: "/appointments",
    icon: <CalendarMonthIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
    preload: "appointments",
  },
  {
    label: "Pagos",
    path: "/payments",
    icon: <PaymentIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT"],
    preload: "payments",
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

  // ── Paciente ───────────────────────────────────────────────
  {
    label: "Mis citas",
    path: "/my-appointments",
    icon: <CalendarMonthIcon />,
    roles: ["PATIENT"],
    preload: "myAppointments",
  },
  {
    label: "Mi Odontograma",
    path: "/odontogram",
    icon: <MedicalServicesIcon />,
    roles: ["PATIENT"],
  },

  // ── Compartido ─────────────────────────────────────────────
  {
    label: "Mi perfil",
    path: "/profile",
    icon: <PersonIcon />,
    roles: ["ADMIN", "DOCTOR", "ASSISTANT", "PATIENT"],
  },

  // ── Solo ADMIN (fondo) ─────────────────────────────────────
  {
    label: "Configuración",
    path: "/settings",
    icon: <SettingsIcon />,
    roles: ["ADMIN"],
    isBottom: true,
  },
];

const SUPER_ADMIN_ITEMS = [
  {
    label: "Resumen SaaS",
    path: "/super-admin",
    icon: <BarChartIcon />,
  },
  {
    label: "Clínicas",
    path: "/super-admin/tenants",
    icon: <BusinessIcon />,
  },
  {
    label: "Mi perfil",
    path: "/profile",
    icon: <PersonIcon />,
    isBottom: true,
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const ROLE_LABEL = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  ASSISTANT: "Asistente",
  PATIENT: "Paciente",
};

// ─────────────────────────────────────────────────────────────
// NavItem — ítem de lista con preloading en hover
// ─────────────────────────────────────────────────────────────
function NavItem({ label, path, icon, active, navigate, onItemClick, preload }) {
  // Dispara el preload del chunk la primera vez que el usuario
  // hace hover sobre el ítem. Idempotente: si ya está cargado, no hace nada.
  const handleMouseEnter = useCallback(() => {
    if (preload && preloadRoutes[preload]) {
      preloadRoutes[preload]();
    }
  }, [preload]);

  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={() => {
          navigate(path);
          onItemClick?.();
        }}
        onMouseEnter={handleMouseEnter}
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
          sx={{ minWidth: 36, color: active ? "white" : "text.secondary" }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          slotProps={{
            primary: { sx: { fontSize: 14, fontWeight: active ? 500 : 400 } },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

// ─────────────────────────────────────────────────────────────
// SidebarContent
// ─────────────────────────────────────────────────────────────
function SidebarContent({
  mainItems,
  bottomItems,
  location,
  navigate,
  profile,
  role,
  onItemClick,
}) {
  const isActive = (path) => {
    if (path === "/super-admin") return location.pathname === "/super-admin";
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ px: 2, gap: 1.5, minHeight: { xs: 56, sm: 64 } }}>
        <Avatar
          sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: 12 }}
        >
          {initials(profile?.full_name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {profile?.full_name ?? ""}
          </Typography>
          <Chip
            label={ROLE_LABEL[role] ?? role}
            size="small"
            color={role === "SUPER_ADMIN" ? "warning" : "default"}
            variant="outlined"
            sx={{ height: 16, fontSize: 10, mt: 0.25 }}
          />
        </Box>
      </Toolbar>
      <Divider />

      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {mainItems.map(({ label, path, icon, preload }) => (
          <NavItem
            key={path}
            label={label}
            path={path}
            icon={icon}
            preload={preload}
            active={isActive(path)}
            navigate={navigate}
            onItemClick={onItemClick}
          />
        ))}
      </List>

      {bottomItems.length > 0 && (
        <>
          <Divider sx={{ mx: 1 }} />
          <List sx={{ px: 1, pb: 1 }}>
            {bottomItems.map(({ label, path, icon, preload }) => (
              <NavItem
                key={path}
                label={label}
                path={path}
                icon={icon}
                preload={preload}
                active={isActive(path)}
                navigate={navigate}
                onItemClick={onItemClick}
              />
            ))}
          </List>
        </>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// MainLayout
// ─────────────────────────────────────────────────────────────
export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile, role, isSuperAdmin } = useAuthStore();
  const { darkMode, toggle } = useThemeStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const sourceItems = isSuperAdmin
    ? SUPER_ADMIN_ITEMS
    : NAV_ITEMS.filter((i) => i.roles.includes(role));

  const mainItems = sourceItems.filter((i) => !i.isBottom);
  const bottomItems = sourceItems.filter((i) => i.isBottom);

  const allItems = [...mainItems, ...bottomItems];
  const activeLabel =
    allItems.find((i) => {
      if (i.path === "/super-admin") return location.pathname === "/super-admin";
      return location.pathname.startsWith(i.path);
    })?.label ?? "Sisodont Pro";

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const drawerProps = {
    mainItems,
    bottomItems,
    location,
    navigate,
    profile,
    role,
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar ───────────────────────────────────────────── */}
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
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            <Typography variant="body1" noWrap>
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
              <IconButton onClick={handleLogout} size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer móvil ─────────────────────────────────────── */}
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
          {...drawerProps}
          onItemClick={() => setMobileOpen(false)}
        />
      </Drawer>

      {/* Drawer desktop ───────────────────────────────────── */}
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
        <SidebarContent {...drawerProps} />
      </Drawer>

      {/* Contenido principal ──────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: { xs: 2, sm: 3 },
          mt: { xs: "56px", sm: "64px" },
          minWidth: 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}