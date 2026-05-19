import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useUsersStore } from "../../stores/useUsersStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import PageHeader from "../../components/PageHeader";

// ─────────────────────────────────────────────────────────────
// Roles que un ADMIN puede asignar.
// SUPER_ADMIN nunca aparece aquí — se gestiona aparte.
// ─────────────────────────────────────────────────────────────
const ROLES = ["ADMIN", "DOCTOR", "ASSISTANT"];

const ROLE_LABELS = {
  ADMIN: "Administrador",
  DOCTOR: "Doctor",
  ASSISTANT: "Asistente",
  PATIENT: "Paciente",
};

const ROLE_COLORS = {
  ADMIN: "error",
  DOCTOR: "primary",
  ASSISTANT: "warning",
  PATIENT: "default",
};

const INVITE_EMPTY = {
  email: "",
  full_name: "",
  role: "DOCTOR",
  password: "",
};

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
// UserCard — vista móvil
// ─────────────────────────────────────────────────────────────
function UserCard({ user, isSelf, onEdit, onToggle }) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "primary.main",
              fontSize: 13,
            }}
          >
            {initials(user.full_name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {user.full_name}
              </Typography>
              {isSelf && (
                <Chip
                  label="Tú"
                  size="small"
                  color="primary"
                  sx={{ height: 16, fontSize: 10 }}
                />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary" }}
              noWrap
            >
              {user.email}
            </Typography>
          </Box>
          <Chip
            label={user.active ? "Activo" : "Inactivo"}
            color={user.active ? "success" : "default"}
            size="small"
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            <Chip
              label={ROLE_LABELS[user.role] ?? user.role}
              color={ROLE_COLORS[user.role] ?? "default"}
              size="small"
              variant="outlined"
            />
            <Typography
              variant="caption"
              sx={{ alignSelf: "center", color: "text.secondary" }}
            >
              {new Date(user.created_at).toLocaleDateString("es-PE")}
            </Typography>
          </Box>

          {/* Acciones deshabilitadas para el propio usuario */}
          <Box>
            <Tooltip
              title={isSelf ? "No puedes editar tu propio rol" : "Editar rol"}
            >
              <span>
                <IconButton
                  size="small"
                  onClick={() => onEdit(user)}
                  disabled={isSelf}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip
              title={
                isSelf
                  ? "No puedes desactivarte a ti mismo"
                  : user.active
                    ? "Desactivar"
                    : "Activar"
              }
            >
              <span>
                <IconButton
                  size="small"
                  onClick={() => onToggle(user)}
                  disabled={isSelf}
                >
                  {user.active ? (
                    <BlockIcon
                      fontSize="small"
                      color={isSelf ? "disabled" : "error"}
                    />
                  ) : (
                    <CheckCircleIcon
                      fontSize="small"
                      color={isSelf ? "disabled" : "success"}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// UsersPage
// ─────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { isMobile } = useBreakpoint();
  const {
    users,
    loading,
    saving,
    fetchUsers,
    inviteUser,
    updateRole,
    toggleActive,
  } = useUsersStore();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [openInvite, setOpenInvite] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [invite, setInviteState] = useState(INVITE_EMPTY);

  const setInviteField = (f) => (e) =>
    setInviteState((p) => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    fetchUsers();
  }, []);

  // ── Crear usuario ─────────────────────────────────────────
  const handleInvite = async () => {
    setActionError("");
    const { error } = await inviteUser(invite);
    if (error) {
      setActionError(error);
      return;
    }
    setActionSuccess("Usuario creado correctamente.");
    setOpenInvite(false);
    setInviteState(INVITE_EMPTY);
  };

  // ── Cambiar rol ───────────────────────────────────────────
  const handleRoleChange = async (userId, role) => {
    const { error } = await updateRole(userId, role);
    if (error) setActionError(error);
    else setActionSuccess("Rol actualizado.");
    setOpenEdit(false);
  };

  // ── Activar / desactivar ──────────────────────────────────
  const handleToggle = async (user) => {
    setActionError("");
    const { error } = await toggleActive(user.id, user.active);
    if (error) setActionError(error);
    else
      setActionSuccess(
        user.active ? "Usuario desactivado." : "Usuario activado.",
      );
  };

  return (
    <Box>
      <PageHeader
        title="Gestión de usuarios"
        subtitle={`${users.length} usuario${users.length !== 1 ? "s" : ""}`}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size={isMobile ? "small" : "medium"}
            onClick={() => {
              setOpenInvite(true);
              setActionError("");
            }}
          >
            {isMobile ? "Nuevo" : "Nuevo usuario"}
          </Button>
        }
      />

      {actionError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setActionError("")}
        >
          {actionError}
        </Alert>
      )}
      {actionSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setActionSuccess("")}
        >
          {actionSuccess}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Vista móvil */}
          {isMobile ? (
            <Box>
              {users.length === 0 ? (
                <Typography
                  sx={{ color: "text.secondary", textAlign: "center", mt: 4 }}
                >
                  No hay usuarios
                </Typography>
              ) : (
                users.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isSelf={u.id === currentUserId}
                    onEdit={(u) => {
                      setSelected(u);
                      setOpenEdit(true);
                    }}
                    onToggle={handleToggle}
                  />
                ))
              )}
            </Box>
          ) : (
            /* Vista desktop */
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Registrado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUserId;
                    return (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: 12,
                                bgcolor: "primary.main",
                              }}
                            >
                              {initials(u.full_name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {u.full_name}
                              </Typography>
                              {isSelf && (
                                <Chip
                                  label="Tú"
                                  size="small"
                                  color="primary"
                                  sx={{ height: 14, fontSize: 10 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {u.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ROLE_LABELS[u.role] ?? u.role}
                            color={ROLE_COLORS[u.role] ?? "default"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.active ? "Activo" : "Inactivo"}
                            color={u.active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(u.created_at).toLocaleDateString("es-PE")}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip
                            title={
                              isSelf
                                ? "No puedes editar tu propio rol"
                                : "Editar rol"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                disabled={isSelf}
                                onClick={() => {
                                  setSelected(u);
                                  setOpenEdit(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={
                              isSelf
                                ? "No puedes desactivarte a ti mismo"
                                : u.active
                                  ? "Desactivar"
                                  : "Activar"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                disabled={isSelf}
                                onClick={() => handleToggle(u)}
                              >
                                {u.active ? (
                                  <BlockIcon
                                    fontSize="small"
                                    color={isSelf ? "disabled" : "error"}
                                  />
                                ) : (
                                  <CheckCircleIcon
                                    fontSize="small"
                                    color={isSelf ? "disabled" : "success"}
                                  />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Modal: nuevo usuario */}
      <Dialog
        open={openInvite}
        onClose={() => setOpenInvite(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Nuevo usuario</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: "16px !important",
          }}
        >
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <TextField
            label="Nombre completo"
            value={invite.full_name}
            onChange={setInviteField("full_name")}
            size="small"
            fullWidth
          />
          <TextField
            label="Correo electrónico"
            type="email"
            value={invite.email}
            onChange={setInviteField("email")}
            size="small"
            fullWidth
          />
          <TextField
            label="Contraseña temporal"
            type="password"
            value={invite.password}
            onChange={setInviteField("password")}
            size="small"
            fullWidth
          />
          <TextField
            select
            label="Rol"
            value={invite.role}
            onChange={setInviteField("role")}
            size="small"
            fullWidth
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenInvite(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleInvite} disabled={saving}>
            {saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "Crear usuario"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: editar rol */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cambiar rol — {selected?.full_name}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField
            select
            label="Rol"
            defaultValue={selected?.role ?? "DOCTOR"}
            size="small"
            fullWidth
            onChange={(e) => handleRoleChange(selected.id, e.target.value)}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEdit(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
