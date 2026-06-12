import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Button,
  Typography,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  Fade,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import TablePagination from "../../components/TablePagination";
import FilterDrawer from "../../components/FilterDrawer";
import FilterButton from "../../components/FilterButton";
import ExportMenu from "../../components/ExportMenu";
import { useTreatmentsExport } from "../../hooks/useTreatmentsExport";
import ConfirmDialog from "../../components/ConfirmDialog";
import useSnackbarStore from "../../stores/useSnackbarStore";

const EMPTY = {
  name: "",
  specialty_id: "",
  price: "",
  duration_min: 30,
  description: "",
  is_multisession: false,
  unit_price: "",
};

// ── Chips de tipo de tratamiento ──────────────────────────────
function TreatmentTypeChip({ isMultisession, unitPrice }) {
  if (isMultisession)
    return (
      <Chip
        label="Multisesión"
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontSize: 10, height: 20 }}
      />
    );
  if (unitPrice)
    return (
      <Chip
        label="Por unidad"
        size="small"
        color="warning"
        variant="outlined"
        sx={{ fontSize: 10, height: 20 }}
      />
    );
  return (
    <Chip
      label="Sesión única"
      size="small"
      variant="outlined"
      sx={{ fontSize: 10, height: 20 }}
    />
  );
}

// ── TreatmentCard — vista móvil ───────────────────────────────
function TreatmentCard({
  t,
  onEdit,
  onToggleActive,
  onOpenPriceDialog,
  isSuperAdmin,
  isAdmin,
  canManage,
}) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 0.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {t.name}
            </Typography>
            {t.description && (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {t.description}
              </Typography>
            )}
          </Box>
          {canManage && (
            <Box sx={{ display: "flex", gap: 0.5, ml: 1, flexShrink: 0 }}>
              {/* Editar: SUPER_ADMIN edita cualquiera, ADMIN solo los suyos */}
              {(isSuperAdmin || t.is_tenant_own) && (
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => onEdit(t)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Ajustar precio: solo ADMIN sobre tratamientos globales */}
              {isAdmin && !t.is_tenant_own && (
                <Tooltip title="Ajustar precio">
                  <IconButton size="small" onClick={() => onOpenPriceDialog(t)}>
                    <AttachMoneyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Activar/Desactivar */}
              <Tooltip title={t.effective_active ? "Desactivar" : "Activar"}>
                <IconButton size="small" onClick={() => onToggleActive(t)}>
                  {t.effective_active ? (
                    <ToggleOffIcon fontSize="small" color="error" />
                  ) : (
                    <ToggleOnIcon fontSize="small" color="success" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            mt: 1,
            alignItems: "center",
          }}
        >
          {t.specialty && (
            <Chip
              label={t.specialty.name}
              size="small"
              variant="outlined"
              sx={{
                bgcolor: t.specialty.color + "22",
                color: t.specialty.color,
                borderColor: t.specialty.color,
              }}
            />
          )}
          <TreatmentTypeChip
            isMultisession={t.is_multisession}
            unitPrice={t.unit_price}
          />
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{
              color: t.is_multisession
                ? "text.secondary"
                : t.unit_price
                  ? "warning.dark"
                  : "success.main",
            }}
          >
            {t.unit_price
              ? `S/ ${Number(t.effective_price).toFixed(2)}/unidad`
              : t.is_multisession
                ? "Pactado por caso"
                : `S/ ${Number(t.effective_price).toFixed(2)}`}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {t.duration_min} min
          </Typography>
          <Chip
            label={t.effective_active ? "Activo" : "Inactivo"}
            size="small"
            color={t.effective_active ? "success" : "default"}
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// TreatmentsTab
//
// isSuperAdmin = true  → CRUD completo
// isSuperAdmin = false → solo lectura + banner informativo
// ─────────────────────────────────────────────────────────────
export default function TreatmentsTab({ onNotify, isSuperAdmin, isAdmin }) {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const canManage = isSuperAdmin || isAdmin;
  const { isMobile } = useBreakpoint();
  const {
    treatmentsCatalog,
    specialties,
    saving,
    loading,
    createTreatment,
    updateTreatment,
    deleteTreatment,
    createTenantTreatment,
    updateTenantTreatment,
    upsertTreatmentConfig,
  } = useCatalogStore();

  const { handlePdf, handleExcel } = useTreatmentsExport(treatmentsCatalog);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  //Drawer
  const [filterOpen, setFilterOpen] = useState(false);

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: EMPTY,
  });

  const isMultisession = watch("is_multisession");
  const unitPrice = watch("unit_price");

  const [priceDialog, setPriceDialog] = useState({
    open: false,
    treatment: null,
    value: "",
  });

  // Filtros y paginación
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState("all"); // "all" | "global" | "own"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [treatmentToToggle, setTreatmentToToggle] = useState(null);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  // ── Sticky barra de filtros ───────────────────────────────
  const [isSticky, setIsSticky] = useState(false);
  const filterBarRef = useRef(null);
  const appBarHeight = isMobile ? 56 : 64;

  useEffect(() => {
    const handleScroll = () => {
      if (!filterBarRef.current) return;
      setIsSticky(
        window.scrollY >= filterBarRef.current.offsetTop - appBarHeight,
      );
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // ejecutar al montar por si hay scroll previo
    return () => window.removeEventListener("scroll", handleScroll);
  }, [appBarHeight]);

  // Animación de entrada de botones en mobile
  useEffect(() => {
    if (open && isMobile) {
      const timer = setTimeout(() => setShowButtons(true), 300);
      return () => clearTimeout(timer);
    } else if (open) {
      setShowButtons(true);
    } else {
      setShowButtons(false);
    }
  }, [open, isMobile]);

  const openCreate = () => {
    //setForm(EMPTY);
    reset(EMPTY);
    setEditId(null);
    setOpen(true);
  };
  const openEdit = (t) => {
    reset({
      name: t.name,
      specialty_id: t.specialty_id ?? "",
      price: t.effective_price ?? t.base_price ?? "",
      unit_price: t.unit_price ? (t.custom_price ?? t.unit_price) : "",
      duration_min: t.duration_min ?? 30,
      description: t.description ?? "",
      is_multisession: t.is_multisession ?? false,
    });
    setEditId(t.id);
    setOpen(true);
  };

  const onSubmit = async (data) => {
    if (!data.is_multisession && !data.unit_price && !data.price) {
      onNotify("Ingresa un precio.", "error");
      return;
    }
    const payload = {
      name: data.name.trim(),
      specialty_id: data.specialty_id || null,
      description: data.description || null,
      duration_min: Number(data.duration_min) || 30,
      is_multisession: data.is_multisession,
      price: data.is_multisession ? 0 : Number(data.price) || 0,
      unit_price: data.unit_price ? Number(data.unit_price) : null,
    };

    const fn = isSuperAdmin
      ? editId
        ? updateTreatment(editId, payload)
        : createTreatment(payload)
      : editId
        ? updateTenantTreatment(editId, payload)
        : createTenantTreatment(payload);

    const { error } = await fn;
    if (error) {
      onNotify(error, "error");
      return;
    }
    onNotify(editId ? "Tratamiento actualizado." : "Tratamiento creado.");
    setOpen(false);
  };

  // SOLO PARA EL SUPER ADMIN
  const handleDelete = async (id) => {
    if (!window.confirm("¿Desactivar este tratamiento?")) return;
    const { error } = await deleteTreatment(id);
    if (error) onNotify(error, "error");
    else onNotify("Tratamiento desactivado.");
  };

  const openPriceDialog = (t) =>
    setPriceDialog({
      open: true,
      treatment: t,
      value: t.custom_price ?? t.base_price ?? "",
    });

  const handleSavePrice = async () => {
    const { error } = await upsertTreatmentConfig(priceDialog.treatment.id, {
      custom_price: Number(priceDialog.value),
    });
    if (error) onNotify(error, "error");
    else {
      onNotify("Precio actualizado.");
      setPriceDialog({ open: false, treatment: null, value: "" });
    }
  };

  const handleConfirmToggle = async () => {
    if (!treatmentToToggle) return;

    setLoadingConfirm(true);

    const newActive = !treatmentToToggle.effective_active;

    let error;
    if (isSuperAdmin) {
      // SUPER_ADMIN siempre edita directo en treatments
      ({ error } = await updateTreatment(treatmentToToggle.id, {
        active: newActive,
      }));
    } else if (treatmentToToggle.is_tenant_own) {
      // ADMIN sobre su propio tratamiento
      ({ error } = await updateTenantTreatment(treatmentToToggle.id, {
        active: newActive,
      }));
    } else {
      // ADMIN sobre tratamiento global → config por tenant
      ({ error } = await upsertTreatmentConfig(treatmentToToggle.id, {
        is_active: newActive,
      }));
    }
    if (error) showSnackbar(error, "error");
    else
      showSnackbar(
        `Tratamiento ${newActive ? "activado" : "desactivado"}.`,
        "success",
      );

    setLoadingConfirm(false);

    setTreatmentToToggle(null);
  };

  const dialogTitle = treatmentToToggle?.effective_active
    ? "Desactivar tratamiento"
    : "Activar tratamiento";

  const dialogMessage = treatmentToToggle?.effective_active
    ? `¿Desea desactivar el tratamiento "${treatmentToToggle?.name}"?`
    : `¿Desea activar el tratamiento "${treatmentToToggle?.name}"?`;

  const confirmText = treatmentToToggle?.effective_active ? "Desactivar" : "Activar";

  const confirmColor = treatmentToToggle?.effective_active ? "error" : "success";

  // ── Lista filtrada ────────────────────────────────────────────
  const filtered = treatmentsCatalog.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchOrigin =
      origin === "all"
        ? true
        : origin === "global"
          ? !t.is_tenant_own
          : t.is_tenant_own;
    return matchSearch && matchOrigin;
  });

  // ── Paginación ────────────────────────────────────────────────
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box>
      {/* Banner para ADMIN */}
      {!canManage && (
        <Alert
          severity="info"
          icon={<LockIcon fontSize="small" />}
          sx={{ mb: 2 }}
        >
          La lista de tratamientos son administrados globalmente por el area de
          soporte. Puedes consultarlos pero no modificarlos.
        </Alert>
      )}

      {/* {canManage && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            size={isMobile ? "small" : "medium"}
          >
            {isMobile ? "Nuevo" : "Nuevo tratamiento"}
          </Button>
        </Box>
      )} */}
      {/* ── Barra de filtros sticky ──────────────────────── */}
      <Box
        ref={filterBarRef}
        sx={{
          position: "sticky",
          top: `${appBarHeight}px`,
          zIndex: (theme) => theme.zIndex.appBar - 1,
          mx: isSticky ? { xs: -2, sm: -3 } : 0,
          px: isSticky ? { xs: 2, sm: 3 } : 0,
          bgcolor: "background.default",
          pb: 1.5,
          pt: isSticky ? 1 : 0,
          boxShadow: isSticky ? 2 : 0,
          transition:
            "box-shadow 0.2s ease, margin 0.2s ease, padding 0.2s ease",
        }}
      >
        {/* Barra superior: filtros + botón nuevo */}
        {/* ── Barra superior desktop ── */}
        {!isMobile && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mb: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Búsqueda */}
            <TextField
              size="small"
              placeholder="Buscar tratamiento..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              sx={{ flex: 1, maxWidth: 300 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Filtro origen — solo ADMIN */}
            {isAdmin && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Origen</InputLabel>
                <Select
                  value={origin}
                  label="Origen"
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="global">Globales</MenuItem>
                  <MenuItem value="own">Propios</MenuItem>
                </Select>
              </FormControl>
            )}

            <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
              <ExportMenu
                onPdfExport={handlePdf}
                onExcelExport={handleExcel}
                totalRows={
                  Array.isArray(treatmentsCatalog)
                    ? treatmentsCatalog.length
                    : 0
                }
                disabled={loading}
              />
              {canManage && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreate}
                >
                  Nuevo tratamiento
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* ── Barra superior móvil ── */}
        {isMobile && (
          <>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 1,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ExportMenu
                onPdfExport={handlePdf}
                onExcelExport={handleExcel}
                totalRows={
                  Array.isArray(treatmentsCatalog)
                    ? treatmentsCatalog.length
                    : 0
                }
                disabled={loading}
              />
              {canManage && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreate}
                  size="small"
                >
                  Nuevo tratamiento
                </Button>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Buscar tratamiento..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                sx={{ flex: 1 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {/* Filtro solo si es ADMIN (tiene el select de origen) */}
              {isAdmin && (
                <FilterButton
                  onClick={() => setFilterOpen(true)}
                  activeCount={origin !== "all" ? 1 : 0}
                />
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Vista móvil */}
      {isMobile ? (
        <Box>
          {paginated.length === 0 ? (
            <Typography
              sx={{ color: "textSecondary", textAlign: "center", mt: 4 }}
            >
              {search || origin !== "all"
                ? "Sin resultados para los filtros aplicados."
                : "No hay tratamientos registrados."}
            </Typography>
          ) : (
            paginated.map((t) => (
              <TreatmentCard
                key={t.id}
                t={t}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={() => setTreatmentToToggle(t)}
                onOpenPriceDialog={openPriceDialog}
                canEdit={isSuperAdmin || t.is_tenant_own}
                isSuperAdmin={isSuperAdmin}
                isAdmin={isAdmin}
                canManage={canManage}
              />
            ))
          )}
          <TablePagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </Box>
      ) : (
        /* Vista desktop */
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Especialidad</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Duración</TableCell>
                  <TableCell>Estado</TableCell>
                  {canManage && <TableCell align="right">Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 7 : 6}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      {search || origin !== "all"
                        ? "Sin resultados para los filtros aplicados."
                        : "No hay tratamientos registrados."}
                    </TableCell>
                  </TableRow>
                )}
                {paginated.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {t.name}
                      </Typography>
                      {t.description && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{
                            display: "block",
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.specialty ? (
                        <Chip
                          label={t.specialty.name}
                          size="small"
                          variant="outlined"
                          sx={{
                            bgcolor: t.specialty.color + "22",
                            color: t.specialty.color,
                            borderColor: t.specialty.color,
                          }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <TreatmentTypeChip
                        isMultisession={t.is_multisession}
                        unitPrice={t.unit_price}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          color: t.is_multisession
                            ? "text.secondary"
                            : t.unit_price
                              ? "warning.dark"
                              : "success.main",
                        }}
                      >
                        {t.unit_price
                          ? `S/ ${Number(t.effective_price).toFixed(2)}/ud.`
                          : t.is_multisession
                            ? "Pactado por caso"
                            : `S/ ${Number(t.effective_price).toFixed(2)}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {t.duration_min} min
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.effective_active ? "Activo" : "Inactivo"}
                        size="small"
                        color={t.effective_active ? "success" : "default"}
                        variant="outlined"
                        sx={{ fontSize: 10, height: 20 }}
                      />
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        {/* Editar: SUPER_ADMIN edita cualquiera, ADMIN solo los suyos */}
                        {(isSuperAdmin || t.is_tenant_own) && (
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(t)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Precio custom: solo ADMIN sobre tratamientos globales */}
                        {isAdmin && !t.is_tenant_own && (
                          <Tooltip title="Ajustar precio">
                            <IconButton
                              size="small"
                              onClick={() => openPriceDialog(t)}
                            >
                              <AttachMoneyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Activar/desactivar */}
                        <Tooltip
                          title={t.effective_active ? "Desactivar" : "Activar"}
                        >
                          <IconButton
                            size="small"
                            onClick={() => setTreatmentToToggle(t)}
                          >
                            {t.effective_active ? (
                              <ToggleOffIcon fontSize="small" color="error" />
                            ) : (
                              <ToggleOnIcon fontSize="small" color="success" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </>
      )}

      {/* Modal — solo si SUPER_ADMIN o ADMIN */}
      {canManage && (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: (theme) => theme.palette.primary.main,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {editId ? (
                <EditIcon sx={{ color: "white" }} />
              ) : (
                <SaveIcon sx={{ color: "white" }} />
              )}
              <Typography
                variant="h6"
                component="span"
                sx={{ color: "white" /*, fontWeight: 600 */ }}
              >
                {editId ? "Editar tratamiento" : "Nuevo tratamiento"}
              </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={() => setOpen(false)}
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

          <DialogContent sx={{ pt: "16px !important" }}>
            <Grid container spacing={2}>
              {/* Nombre */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "El nombre es requerido." }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Nombre del tratamiento *"
                      size="small"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              {/* Especialidad */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="specialty_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Especialidad"
                      size="small"
                      fullWidth
                    >
                      <MenuItem value="">Sin especialidad</MenuItem>
                      {specialties
                        .filter((sp) => sp.active === true)
                        .map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Tipo de tratamiento */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography variant="body2" fontWeight={500} sx={{ mb: 1.5 }}>
                    Tipo de tratamiento
                  </Typography>

                  {/* Switch multisesión */}
                  <Controller
                    name="is_multisession"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        sx={{ mb: 1, alignItems: "flex-start" }}
                        control={
                          <Switch
                            checked={field.value}
                            color="primary"
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              if (e.target.checked) setValue("unit_price", "");
                            }}
                          />
                        }
                        label={
                          <Box sx={{ pt: 0.5 }}>
                            <Typography variant="body2" fontWeight={500}>
                              Tratamiento multisesión
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Se cita al paciente varias veces. El costo total
                              se pacta al crear el caso.
                            </Typography>
                          </Box>
                        }
                      />
                    )}
                  />

                  {/* Switch precio por unidad — solo si no es multisesión */}
                  {!isMultisession && (
                    <Controller
                      name="unit_price"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          sx={{ alignItems: "flex-start" }}
                          control={
                            <Switch
                              checked={!!field.value}
                              color="warning"
                              onChange={(e) => {
                                field.onChange(e.target.checked ? "50" : "");
                                if (e.target.checked) setValue("price", "0");
                              }}
                            />
                          }
                          label={
                            <Box sx={{ pt: 0.5 }}>
                              <Typography variant="body2" fontWeight={500}>
                                Precio por unidad
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                El total se calcula por cantidad (ej: por diente
                                tratado).
                              </Typography>
                            </Box>
                          }
                        />
                      )}
                    />
                  )}

                  {isMultisession && (
                    <Alert severity="info" sx={{ mt: 1.5 }} icon={false}>
                      <Typography variant="caption">
                        El precio se acuerda con el paciente al abrir el caso de
                        tratamiento.
                      </Typography>
                    </Alert>
                  )}
                  {!isMultisession && unitPrice && (
                    <Alert severity="warning" sx={{ mt: 1.5 }} icon={false}>
                      <Typography variant="caption">
                        Al crear una cita se pedirá la cantidad de unidades y el
                        total se calculará automáticamente.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Grid>

              {/* Precio por sesión */}
              {!isMultisession && !unitPrice && (
                <Grid size={{ xs: 6 }}>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Precio por sesión *"
                        type="number"
                        size="small"
                        fullWidth
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                S/
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Precio por unidad */}
              {!isMultisession && !!unitPrice && (
                <Grid size={{ xs: 6 }}>
                  <Controller
                    name="unit_price"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Precio por unidad *"
                        type="number"
                        size="small"
                        fullWidth
                        helperText="Por diente / pieza"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                S/
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Duración */}
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="duration_min"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Duración por sesión"
                      type="number"
                      size="small"
                      fullWidth
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">min</InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Descripción */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Descripción"
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Descripción del tratamiento, indicaciones..."
                    />
                  )}
                />
              </Grid>
            </Grid>
            {/* Botones dentro del contenido en mobile con animación */}
            {isMobile && (
              <Fade in={showButtons} timeout={500}>
                <Stack spacing={1.5} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleSubmit(onSubmit)}
                    disabled={saving}
                    startIcon={
                      saving ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : null
                    }
                  >
                    {saving
                      ? "Guardando..."
                      : editId
                        ? "Guardar cambios"
                        : "Crear tratamiento"}
                  </Button>
                  <Button
                    onClick={() => setOpen(false)}
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
              <Button onClick={() => setOpen(false)}>Cancelar</Button>
              {/* handleSubmit de RHF valida primero, luego llama onSubmit */}
              <Button
                variant="contained"
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : editId ? (
                  "Guardar cambios"
                ) : (
                  "Crear tratamiento"
                )}
              </Button>
            </DialogActions>
          )}
        </Dialog>
      )}

      <Dialog
        open={priceDialog.open}
        onClose={() => setPriceDialog((p) => ({ ...p, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Precio para {priceDialog.treatment?.name}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField
            label="Precio personalizado"
            type="number"
            value={priceDialog.value}
            onChange={(e) =>
              setPriceDialog((p) => ({ ...p, value: e.target.value }))
            }
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">S/</InputAdornment>
                ),
              },
            }}
            helperText={`Precio base global: S/ ${Number(priceDialog.treatment?.base_price ?? 0).toFixed(2)}`}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPriceDialog((p) => ({ ...p, open: false }))}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePrice}
            disabled={saving}
          >
            Guardar precio
          </Button>
        </DialogActions>
      </Dialog>
      {/* Drawer filtros móvil — solo ADMIN */}
      {isAdmin && (
        <FilterDrawer
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onApply={() => setFilterOpen(false)}
          onClear={() => {
            setOrigin("all");
            setPage(1);
            setFilterOpen(false);
          }}
          activeCount={origin !== "all" ? 1 : 0}
        >
          <FormControl size="small" fullWidth>
            <InputLabel>Origen</InputLabel>
            <Select
              value={origin}
              label="Origen"
              onChange={(e) => {
                setOrigin(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="global">Globales</MenuItem>
              <MenuItem value="own">Propios</MenuItem>
            </Select>
          </FormControl>
        </FilterDrawer>
      )}
      <ConfirmDialog
        open={!!treatmentToToggle}
        title={dialogTitle}
        message={dialogMessage}
        confirmText={confirmText}
        confirmColor={confirmColor}
        onClose={() => setTreatmentToToggle(null)}
        onConfirm={handleConfirmToggle}
        loading={loadingConfirm}
      />
    </Box>
  );
}
