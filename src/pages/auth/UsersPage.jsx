import { useEffect, useState, useCallback, useMemo, memo } from "react";
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
  Fade,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import { useUsersStore } from "../../stores/useUsersStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import PageHeader from "../../components/PageHeader";

// ─────────────────────────────────────────────────────────────
// Constantes — fuera del componente para evitar recreación
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

// Formateador reutilizable — instanciado una sola vez
const dateFormatter = new Intl.DateTimeFormat("es-PE");

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// UserCard — memoizado para que solo re-renderice si sus props
// cambian. Sin memo, re-renderiza cada vez que UsersPage
// actualiza cualquier estado (ej. actionSuccess).
// ─────────────────────────────────────────────────────────────
const UserCard = memo(function UserCard({ user, isSelf, onEdit, onToggle }) {
  // Formatear fecha una sola vez por render de esta card
  const createdAt = useMemo(
    () => dateFormatter.format(new Date(user.created_at)),
    [user.created_at],
  );

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
              {createdAt}
            </Typography>
          </Box>

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
});

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
  // Selector estable: solo re-suscribe a cambios de user.id
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [openInvite, setOpenInvite] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [invite, setInviteState] = useState(INVITE_EMPTY);
  const [showButtons, setShowButtons] = useState(false);

  // Animación de entrada de botones en mobile
  useEffect(() => {
    if (openInvite && isMobile) {
      const timer = setTimeout(() => setShowButtons(true), 300);
      return () => clearTimeout(timer);
    } else if (openInvite) {
      setShowButtons(true);
    } else {
      setShowButtons(false);
    }
  }, [openInvite, isMobile]);

  useEffect(() => {
    fetchUsers();
    // fetchUsers es estable si el store la define fuera del render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers memoizados ───────────────────────────────────
  // useCallback evita que UserCard reciba nuevas referencias en
  // cada render, lo que dispararía re-renders aunque memo esté.

  const setInviteField = useCallback(
    (f) => (e) => setInviteState((p) => ({ ...p, [f]: e.target.value })),
    [],
  );

  const handleOpenInvite = useCallback(() => {
    setOpenInvite(true);
    setActionError("");
  }, []);

  const handleCloseInvite = useCallback(() => {
    setOpenInvite(false);
    setInviteState(INVITE_EMPTY);
  }, []);

  const handleCloseEdit = useCallback(() => setOpenEdit(false), []);

  let mensajeTraducido =
    "Ocurrió un error inesperado. Por favor, intenta de nuevo.";

  const handleInvite = useCallback(async () => {
    setActionError("");
    if (invite?.full_name.length < 5) {
      setActionError(
        "Ingrese sus nombres y apellidos en el campo correspondiente.",
      );
      return;
    }
    if (invite?.email.length < 5) {
      setActionError(
        "Ingrese su dirección de correo electrónico en el campo correspondiente.",
      );
      return;
    }
    if (invite?.password.length < 5) {
      setActionError("La contraseña debe ser mayor o igual a 5 caracteres.");
      return;
    }
    const { error } = await inviteUser(invite);
    if (error) {
      setActionError(
        error.includes(
          "A user with this email address has already been registered",
        )
          ? "Este correo electrónico ya está en uso. Intenta con otro."
          : mensajeTraducido,
      );
      return;
    }
    setActionSuccess("Usuario creado correctamente.");
    setOpenInvite(false);
    setInviteState(INVITE_EMPTY);
  }, [invite, inviteUser]);

  const handleRoleChange = useCallback(
    async (userId, role) => {
      const { error } = await updateRole(userId, role);
      if (error) setActionError(error);
      else setActionSuccess("Rol actualizado.");
      setOpenEdit(false);
    },
    [updateRole],
  );

  const handleToggle = useCallback(
    async (user) => {
      setActionError("");
      const { error } = await toggleActive(user.id, user.active);
      if (error) setActionError(error);
      else
        setActionSuccess(
          user.active ? "Usuario desactivado." : "Usuario activado.",
        );
    },
    [toggleActive],
  );

  // Callback estable para UserCard.onEdit
  const handleOpenEdit = useCallback((u) => {
    setSelected(u);
    setOpenEdit(true);
  }, []);

  // ── Datos derivados memoizados ────────────────────────────
  const subtitle = useMemo(
    () => `${users.length} usuario${users.length !== 1 ? "s" : ""}`,
    [users.length],
  );

  const headerActions = useMemo(
    () => (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        size={isMobile ? "small" : "medium"}
        onClick={handleOpenInvite}
      >
        {isMobile ? "Nuevo" : "Nuevo usuario"}
      </Button>
    ),
    [isMobile, handleOpenInvite],
  );

  return (
    <Box>
      <PageHeader
        title="Gestión de usuarios"
        subtitle={subtitle}
        actions={headerActions}
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
                    onEdit={handleOpenEdit}
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
                      <UserRow
                        key={u.id}
                        user={u}
                        isSelf={isSelf}
                        onEdit={handleOpenEdit}
                        onToggle={handleToggle}
                      />
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
        onClose={handleCloseInvite}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            //pb: 1.5,
            backgroundColor: (theme) => theme.palette.primary.main,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SaveIcon sx={{ color: "white" }} />
            <Typography variant="h6" component="span" sx={{ color: "white" }}>
              Nuevo usuario
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleCloseInvite}
            size="small"
            sx={{
              color: "white",
              "&:hover": {
                bgcolor: (theme) => theme.palette.action.hover,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
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
            label="Nombres y Apellidos"
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
          {/* Botones dentro del contenido en mobile con animación */}
          {isMobile && (
            <Fade in={showButtons} timeout={500}>
              <Stack spacing={1.5} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleInvite}
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : null
                  }
                >
                  {saving ? "Creando usuario..." : "Crear usuario"}
                </Button>
                <Button
                  onClick={handleCloseInvite}
                  variant="outlined"
                  size="large"
                  fullWidth
                  color="inherit"
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </Stack>
            </Fade>
          )}
        </DialogContent>
        {/* Acciones solo en desktop */}
        {!isMobile && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseInvite}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleInvite}
              disabled={saving}
            >
              {saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                "Crear usuario"
              )}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Modal: editar rol */}
      <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar rol — {selected?.full_name}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField
            select
            label="Rol"
            // key fuerza re-mount cuando cambia el usuario seleccionado,
            // evitando que defaultValue quede obsoleto entre aperturas
            key={selected?.id}
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
          <Button onClick={handleCloseEdit}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// UserRow — fila de tabla memoizada (vista desktop)
// Extraída del map inline para que memo funcione correctamente.
// Un componente definido dentro de otro no puede ser memoizado
// de forma efectiva porque se redefine en cada render del padre.
// ─────────────────────────────────────────────────────────────
const UserRow = memo(function UserRow({ user, isSelf, onEdit, onToggle }) {
  const createdAt = useMemo(
    () => dateFormatter.format(new Date(user.created_at)),
    [user.created_at],
  );

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: 12,
              bgcolor: "primary.main",
            }}
          >
            {initials(user.full_name)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {user.full_name}
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
        <Typography variant="body2" color="textSecondary">
          {user.email}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={ROLE_LABELS[user.role] ?? user.role}
          color={ROLE_COLORS[user.role] ?? "default"}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Chip
          label={user.active ? "Activo" : "Inactivo"}
          color={user.active ? "success" : "default"}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="textSecondary">
          {createdAt}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Tooltip
          title={isSelf ? "No puedes editar tu propio rol" : "Editar rol"}
        >
          <span>
            <IconButton
              size="small"
              disabled={isSelf}
              onClick={() => onEdit(user)}
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
              disabled={isSelf}
              onClick={() => onToggle(user)}
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
      </TableCell>
    </TableRow>
  );
});
