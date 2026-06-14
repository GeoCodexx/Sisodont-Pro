import { useState, useCallback, useRef, useEffect } from "react";
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
  Popover,
  MenuItem,
  ListItemIcon as MenuItemIcon,
  CircularProgress,
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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AppLogoIcon from "../assets/icon_sisodont.png";

import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { preloadRoutes } from "../router";

const DRAWER_WIDTH = 224;
//const APP_LOGO = "/assets/icon_sisodont.png";

// ─────────────────────────────────────────────────────────────
// Definición de ítems de navegación por rol.
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
  // {
  //   label: "Mi perfil",
  //   path: "/profile",
  //   icon: <PersonIcon />,
  //   roles: ["ADMIN", "DOCTOR", "ASSISTANT", "PATIENT"],
  // },

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
    exact: true,
  },
  {
    label: "Clínicas",
    path: "/super-admin/tenants",
    icon: <BusinessIcon />,
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
// Logo de la aplicación
// ─────────────────────────────────────────────────────────────
function AppLogo({ clinicName, compact = false }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Box
        component="img"
        src={AppLogoIcon}
        alt="Sisodont"
        sx={{
          height: compact ? 28 : 32,
          width: "auto",
          flexShrink: 0,
          objectFit: "contain",
        }}
        onError={(e) => {
          // Fallback si no carga la imagen
          e.target.style.display = "none";
        }}
      />
      {!compact && (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1,
              color: "primary.main",
              display: "block",
              lineHeight: 1.1,
              textTransform: "uppercase",
            }}
          >
            Sisodont Pro
          </Typography>
          {clinicName && (
            <Typography
              variant="caption"
              sx={{
                fontSize: 10,
                color: "text.secondary",
                display: "block",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 140,
              }}
            >
              {clinicName}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// UserMenu — Avatar con popover desplegable
// ─────────────────────────────────────────────────────────────
function UserMenu({ profile, role, onLogout, onProfile }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          cursor: "pointer",
          px: 1,
          py: 0.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: open ? "primary.main" : "divider",
          transition: "all 0.15s ease",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "action.hover",
          },
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: "primary.main",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {initials(profile?.full_name)}
        </Avatar>
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontSize: 12, lineHeight: 1.2 }}
            noWrap
          >
            {profile?.full_name ?? ""}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: 10, lineHeight: 1 }}
          >
            {ROLE_LABEL[role] ?? role}
          </Typography>
        </Box>
        <KeyboardArrowDownIcon
          sx={{
            fontSize: 16,
            color: "text.secondary",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            display: { xs: "none", sm: "block" },
          }}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 180,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        {/* Header del menú */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {profile?.full_name ?? ""}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {profile?.email ?? ""}
          </Typography>
        </Box>

        <List dense sx={{ py: 0.5 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setAnchorEl(null);
                onProfile?.();
              }}
              sx={{ borderRadius: 1, mx: 0.5, px: 1.5 }}
            >
              <MenuItemIcon sx={{ minWidth: 32 }}>
                <PersonIcon fontSize="small" />
              </MenuItemIcon>
              <ListItemText
                primary="Mi perfil"
                slotProps={{ primary: { sx: { fontSize: 13 } } }}
              />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 0.5 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setAnchorEl(null);
                onLogout?.();
              }}
              sx={{
                borderRadius: 1,
                mx: 0.5,
                px: 1.5,
                color: "error.main",
                "&:hover": { bgcolor: "error.50" },
              }}
            >
              <MenuItemIcon sx={{ minWidth: 32, color: "error.main" }}>
                <LogoutIcon fontSize="small" />
              </MenuItemIcon>
              <ListItemText
                primary="Cerrar sesión"
                slotProps={{
                  primary: { sx: { fontSize: 13, color: "error.main" } },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Popover>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// NavItem — ítem de lista con preloading en hover
// ─────────────────────────────────────────────────────────────
/*function NavItem({
  label,
  path,
  icon,
  active,
  navigate,
  onItemClick,
  preload,
  isSuperAdmin,
}) {
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
            bgcolor: isSuperAdmin ? "warning.main" : "primary.main",
            color: "white",
            "& .MuiListItemIcon-root": { color: "white" },
            "&:hover": {
              bgcolor: isSuperAdmin ? "warning.dark" : "primary.dark",
            },
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
}*/
// DESPUÉS:
function NavItem({
  label,
  path,
  icon,
  active,
  navigate,
  onItemClick,
  preload,
  isSuperAdmin,
  navigating,
  setNavigating,
}) {
  const handleMouseEnter = useCallback(() => {
    if (preload && preloadRoutes[preload]) {
      preloadRoutes[preload]();
    }
  }, [preload]);

  // Limpiar indicador cuando la ruta ya está activa (chunk cargado)
  useEffect(() => {
    if (active && navigating) {
      setNavigating(false);
    }
  }, [active, navigating, setNavigating]);

  const isLoading = navigating === path;

  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={() => {
          if (active) return; // ya estamos aquí
          setNavigating(path);
          navigate(path);
          onItemClick?.();
        }}
        onMouseEnter={handleMouseEnter}
        selected={active}
        sx={{
          borderRadius: 2,
          "&.Mui-selected": {
            bgcolor: isSuperAdmin ? "warning.main" : "primary.main",
            color: "white",
            "& .MuiListItemIcon-root": { color: "white" },
            "&:hover": {
              bgcolor: isSuperAdmin ? "warning.dark" : "primary.dark",
            },
          },
        }}
      >
        <ListItemIcon
          sx={{ minWidth: 36, color: active ? "white" : "text.secondary" }}
        >
          {isLoading ? <CircularProgress size={18} color="inherit" /> : icon}
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
// SidebarUserButton — botón de usuario al fondo del sidebar
// ─────────────────────────────────────────────────────────────
function SidebarUserButton({
  profile,
  role,
  onProfile,
  onLogout,
  isSuperAdmin,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  return (
    <>
      <Box
        ref={anchorRef}
        onClick={() => setOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1,
          mx: 1,
          mb: 1,
          borderRadius: 2,
          cursor: "pointer",
          border: "1px solid",
          borderColor: "divider",
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor: "action.hover",
            borderColor: isSuperAdmin ? "warning.main" : "primary.main",
          },
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: isSuperAdmin ? "warning.main" : "primary.main",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials(profile?.full_name)}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontSize: 12, lineHeight: 1.2 }}
            noWrap
          >
            {profile?.full_name ?? ""}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: 10, lineHeight: 1 }}
          >
            {ROLE_LABEL[role] ?? role}
          </Typography>
        </Box>
        <KeyboardArrowDownIcon
          sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              mb: 0.5,
              width: 196,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        <List dense sx={{ py: 0.5 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setOpen(false);
                onProfile?.();
              }}
              sx={{ borderRadius: 1, mx: 0.5, px: 1.5 }}
            >
              <MenuItemIcon sx={{ minWidth: 32 }}>
                <PersonIcon fontSize="small" />
              </MenuItemIcon>
              <ListItemText
                primary="Mi perfil"
                slotProps={{ primary: { sx: { fontSize: 13 } } }}
              />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 0.5 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              sx={{
                borderRadius: 1,
                mx: 0.5,
                px: 1.5,
                color: "error.main",
                "&:hover": { bgcolor: "error.50" },
              }}
            >
              <MenuItemIcon sx={{ minWidth: 32, color: "error.main" }}>
                <LogoutIcon fontSize="small" />
              </MenuItemIcon>
              <ListItemText
                primary="Cerrar sesión"
                slotProps={{
                  primary: { sx: { fontSize: 13, color: "error.main" } },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Popover>
    </>
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
  clinicName,
  isSuperAdmin,
  navigating,
  setNavigating,
  onItemClick,
  onProfile,
  onLogout,
}) {
  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo + Clínica */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <AppLogo clinicName={clinicName} />
      </Box>
      <Divider />

      {/* Nav principal */}
      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {mainItems.map((item) => (
          <NavItem
            key={item.path}
            {...item}
            active={isActive(item)}
            navigate={navigate}
            onItemClick={onItemClick}
            isSuperAdmin={isSuperAdmin}
            navigating={navigating}
            setNavigating={setNavigating}
          />
        ))}
      </List>

      {/* Nav bottom (Settings, etc.) */}
      {bottomItems.length > 0 && (
        <>
          <Divider sx={{ mx: 1 }} />
          <List sx={{ px: 1, pt: 0.5 }}>
            {bottomItems.map((item) => (
              <NavItem
                key={item.path}
                {...item}
                active={isActive(item)}
                navigate={navigate}
                onItemClick={onItemClick}
                isSuperAdmin={isSuperAdmin}
              />
            ))}
          </List>
        </>
      )}

      {/* Botón de usuario al fondo */}
      <Divider sx={{ mx: 1, mb: 0.5, display: { xs: "flex", md: "none" } }} />
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <SidebarUserButton
          profile={profile}
          role={role}
          isSuperAdmin={isSuperAdmin}
          onProfile={() => {
            onProfile?.();
            onItemClick?.();
          }}
          onLogout={onLogout}
        />
      </Box>
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
  const { settings, loading, fetchSettings, clearSettings } =
    useSettingsStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchSettings();
    } else {
      clearSettings();
    }
  }, [profile?.id]);

  // Nombre de clínica: SuperAdmin siempre ve "Sisodont Pro"
  /*const clinicName = isSuperAdmin
    ? "Sisodont Pro"
    : (settings?.clinic_name ?? "");*/
  const clinicName = isSuperAdmin
    ? "Sisodont Pro"
    : loading
      ? "Cargando..."
      : settings?.clinic_name || "Mi Clínica";

  const sourceItems = isSuperAdmin
    ? SUPER_ADMIN_ITEMS
    : NAV_ITEMS.filter((i) => i.roles?.includes(role));

  const mainItems = sourceItems.filter((i) => !i.isBottom);
  const bottomItems = sourceItems.filter((i) => i.isBottom);

  const allItems = [...mainItems, ...bottomItems];
  const activeLabel =
    allItems.find((i) => {
      if (i.exact) return location.pathname === i.path;
      return location.pathname.startsWith(i.path);
    })?.label ?? "Sisodont Pro";

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => navigate("/profile");

  /*const sidebarProps = {
    mainItems,
    bottomItems,
    location,
    navigate,
    profile,
    role,
    clinicName,
    isSuperAdmin,
    onProfile: handleProfile,
    onLogout: handleLogout,
  };*/
  const sidebarProps = {
    mainItems,
    bottomItems,
    location,
    navigate,
    profile,
    role,
    clinicName,
    isSuperAdmin,
    navigating,
    setNavigating,
    onProfile: handleProfile,
    onLogout: handleLogout,
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* ── AppBar ─────────────────────────────────────────── */}
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
            px: { xs: 1.5, sm: 2 },
          }}
        >
          {/* ── MOBILE: hamburger + título sección + tema ── */}
          {isMobile ? (
            <>
              {/* Izquierda: hamburger */}
              <IconButton
                onClick={() => setMobileOpen(true)}
                size="small"
                edge="start"
              >
                <MenuIcon />
              </IconButton>

              {/* Centro: nombre de sección */}
              <Typography
                variant="body1"
                fontWeight={600}
                noWrap
                sx={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {activeLabel}
              </Typography>

              {/* Derecha: icono de tema */}
              <Tooltip title={darkMode ? "Modo claro" : "Modo oscuro"}>
                <IconButton onClick={toggle} size="small" edge="end">
                  {darkMode ? (
                    <Brightness7Icon fontSize="small" />
                  ) : (
                    <Brightness4Icon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </>
          ) : (
            /* ── DESKTOP: logo+clínica izq. / acciones der. ── */
            <>
              {/* Izquierda: logo + nombre de clínica */}
              {/* <AppLogo clinicName={clinicName} /> */}
              <Typography variant="body1" fontWeight={500} noWrap>
                {activeLabel}
              </Typography>

              {/* Derecha: tema + perfil */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip title={darkMode ? "Modo claro" : "Modo oscuro"}>
                  <IconButton onClick={toggle} size="small">
                    {darkMode ? (
                      <Brightness7Icon fontSize="small" />
                    ) : (
                      <Brightness4Icon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>

                <UserMenu
                  profile={profile}
                  role={role}
                  onProfile={handleProfile}
                  onLogout={handleLogout}
                />
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Drawer móvil ──────────────────────────────────── */}
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
          {...sidebarProps}
          onItemClick={() => setMobileOpen(false)}
        />
      </Drawer>

      {/* ── Drawer desktop ────────────────────────────────── */}
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
        <SidebarContent {...sidebarProps} />
      </Drawer>

      {/* ── Contenido principal ───────────────────────────── */}
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
