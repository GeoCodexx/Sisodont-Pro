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
  Chip,
  useTheme,
  useMediaQuery,
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

import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";

const DRAWER_WIDTH = 224;

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
  // "Clínicas" eliminado del sidebar — la navegación es desde la tabla del dashboard
  {
    label: "Mi perfil",
    path: "/profile",
    icon: <PersonIcon />,
    isBottom: true,
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

function SidebarContent({ location, navigate, profile, onItemClick }) {
  const mainItems = NAV_ITEMS.filter((i) => !i.isBottom);
  const bottomItems = NAV_ITEMS.filter((i) => i.isBottom);

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ px: 2, gap: 1.5, minHeight: { xs: 56, sm: 64 } }}>
        <Avatar
          sx={{ width: 28, height: 28, bgcolor: "warning.main", fontSize: 12 }}
        >
          {initials(profile?.full_name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {profile?.full_name ?? ""}
          </Typography>
          <Chip
            label="Super Admin"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ height: 16, fontSize: 10, mt: 0.25 }}
          />
        </Box>
      </Toolbar>
      <Divider />

      {/* Badge identificador del módulo */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AdminPanelSettingsIcon fontSize="small" color="warning" />
          <Typography
            variant="caption"
            sx={{ color: "warning.main", fontWeight: 600 }}
          >
            PANEL SUPER ADMIN
          </Typography>
        </Box>
      </Box>
      <Divider />

      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {mainItems.map((item) => (
          <NavItem
            key={item.path}
            {...item}
            active={isActive(item)}
            navigate={navigate}
            onItemClick={onItemClick}
          />
        ))}
      </List>

      {bottomItems.length > 0 && (
        <>
          <Divider sx={{ mx: 1 }} />
          <List sx={{ px: 1, pb: 1 }}>
            {bottomItems.map((item) => (
              <NavItem
                key={item.path}
                {...item}
                active={location.pathname.startsWith(item.path)}
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

  const drawerContent = (
    <SidebarContent
      location={location}
      navigate={navigate}
      profile={profile}
      onItemClick={() => setMobileOpen(false)}
    />
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
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
            <Typography variant="body1" fontWeight={500} noWrap>
              {activeLabel}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                display: { xs: "none", sm: "block" },
                mr: 0.5,
                color: "text.secondary",
              }}
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

      {/* Drawer móvil */}
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

      {/* Drawer desktop */}
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
        {drawerContent}
      </Drawer>

      {/* Contenido */}
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
