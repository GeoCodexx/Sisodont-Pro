import { useState, useRef } from "react";
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
  useTheme,
  useMediaQuery,
  Popover,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CategoryIcon from "@mui/icons-material/Category";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AppLogoIcon from "../assets/icon_sisodont.png";

import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";

const DRAWER_WIDTH = 224;
//const APP_LOGO = "../assets/icon_sisodont.png";
const CLINIC_NAME_SUPER = "Sisodont Pro";

const NAV_ITEMS = [
  {
    label: "Resumen SaaS",
    path: "/super-admin",
    icon: <BarChartIcon />,
    exact: true,
  },
  {
    label: "Catálogo global",
    path: "/super-admin/catalog",
    icon: <CategoryIcon />,
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

// ─────────────────────────────────────────────────────────────
// AppLogo
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
              color: "warning.main",
              display: "block",
              lineHeight: 1.1,
              textTransform: "uppercase",
            }}
          >
            Sisodont
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
// UserMenu — Avatar con popover desplegable (AppBar desktop)
// ─────────────────────────────────────────────────────────────
function UserMenu({ profile, onLogout, onProfile }) {
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
          borderColor: open ? "warning.main" : "divider",
          transition: "all 0.15s ease",
          "&:hover": {
            borderColor: "warning.main",
            bgcolor: "action.hover",
          },
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: "warning.main",
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
            Super Admin
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
              <ListItemIcon sx={{ minWidth: 32 }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
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
              <ListItemIcon sx={{ minWidth: 32, color: "error.main" }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
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
// SidebarUserButton — botón de usuario al fondo del sidebar
// ─────────────────────────────────────────────────────────────
function SidebarUserButton({ profile, onProfile, onLogout }) {
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
            borderColor: "warning.main",
          },
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: "warning.main",
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
            Super Admin
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
              <ListItemIcon sx={{ minWidth: 32 }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
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
              <ListItemIcon sx={{ minWidth: 32, color: "error.main" }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
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
// NavItem
// ─────────────────────────────────────────────────────────────
function NavItem({ label, path, icon, active, navigate, onItemClick }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={() => {
          navigate(path);
          onItemClick?.();
        }}
        selected={active}
        sx={{
          borderRadius: 2,
          "&.Mui-selected": {
            bgcolor: "warning.main",
            color: "white",
            "& .MuiListItemIcon-root": { color: "white" },
            "&:hover": { bgcolor: "warning.dark" },
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
  location,
  navigate,
  profile,
  onItemClick,
  onProfile,
  onLogout,
}) {
  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo + nombre SuperAdmin */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <AppLogo clinicName={CLINIC_NAME_SUPER} />
      </Box>
      <Divider />

      {/* Badge Super Admin */}
      <Box sx={{ px: 2, py: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <AdminPanelSettingsIcon fontSize="small" color="warning" />
          <Typography
            variant="caption"
            sx={{ color: "warning.main", fontWeight: 700, letterSpacing: 0.5 }}
          >
            PANEL SUPER ADMIN
          </Typography>
        </Box>
      </Box>
      <Divider />

      {/* Nav items */}
      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            {...item}
            active={isActive(item)}
            navigate={navigate}
            onItemClick={onItemClick}
          />
        ))}
      </List>

      {/* Botón de usuario al fondo */}
      <Divider sx={{ mx: 1, mb: 0.5, display: { xs: "flex", md: "none" } }} />
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <SidebarUserButton
          profile={profile}
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
// SuperAdminLayout
// ─────────────────────────────────────────────────────────────
export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuthStore();
  const { darkMode, toggle } = useThemeStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLabel =
    NAV_ITEMS.find((i) =>
      i.exact
        ? location.pathname === i.path
        : location.pathname.startsWith(i.path),
    )?.label ?? "Super Admin";

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => navigate("/profile");

  const sidebarProps = {
    location,
    navigate,
    profile,
    onProfile: handleProfile,
    onLogout: handleLogout,
  };

  const drawerContent = (
    <SidebarContent
      {...sidebarProps}
      onItemClick={() => setMobileOpen(false)}
    />
  );

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
          {isMobile ? (
            /* ── MOBILE ─────────────────────────────────── */
            <>
              {/* Izquierda: hamburger */}
              <IconButton
                onClick={() => setMobileOpen(true)}
                size="small"
                edge="start"
              >
                <MenuIcon />
              </IconButton>

              {/* Centro: nombre de sección activa */}
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

              {/* Derecha: toggle tema */}
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
            /* ── DESKTOP ────────────────────────────────── */
            <>
              {/* Izquierda: logo + "Sisodont Pro" */}
              {/* <AppLogo clinicName={CLINIC_NAME_SUPER} /> */}
              <Typography variant="body1" fontWeight={500} noWrap>
                {activeLabel}
              </Typography>

              {/* Derecha: toggle tema + perfil */}
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
        {drawerContent}
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

      {/* ── Contenido ─────────────────────────────────────── */}
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
