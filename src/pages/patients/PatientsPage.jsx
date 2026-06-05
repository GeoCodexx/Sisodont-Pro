import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Typography,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { usePatientStore } from "../../stores/usePatientStore";
import { useRole } from "../../hooks/useRole";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useDebounce } from "../../hooks/useDebounce";
import PatientFormModal from "./PatientFormModal";
import FilterDrawer from "../../components/FilterDrawer";
import FilterButton from "../../components/FilterButton";
import PageHeader from "../../components/PageHeader";
import TablePagination from "../../components/TablePagination";
import { usePatientsExport } from "../../hooks/usePatientsExport";
import ExportMenu from "../../components/ExportMenu";

// ─────────────────────────────────────────────────────────────
// Helpers puros fuera del componente
// ─────────────────────────────────────────────────────────────
function calcAge(birth) {
  if (!birth) return "—";
  return (
    Math.floor(
      (Date.now() - new Date(birth)) / (1000 * 60 * 60 * 24 * 365.25),
    ) + " a"
  );
}

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Valor vacío de filtros del drawer
const DRAWER_FILTERS_EMPTY = { activeStatus: "all" };

// ─────────────────────────────────────────────────────────────
// PatientCard (móvil)
// ─────────────────────────────────────────────────────────────
const PatientCard = memo(function PatientCard({
  patient,
  onView,
  onEdit,
  onToggleActive,
  canEdit,
  canDelete,
}) {
  const age = useMemo(() => calcAge(patient.birth_date), [patient.birth_date]);

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
            {initials(patient.full_name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                {patient.full_name}
              </Typography>
              <Chip
                label={patient.active ? "Activo" : "Inactivo"}
                size="small"
                color={patient.active ? "success" : "default"}
                variant="outlined"
                sx={{ flexShrink: 0 }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {patient.dni ? "DNI: " + patient.dni : "Sin DNI"} · {age}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
          {patient.diabetes && (
            <Chip
              label="Diabetes"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {patient.hypertension && (
            <Chip label="HTA" size="small" color="error" variant="outlined" />
          )}
          {patient.pregnancy && (
            <Chip
              label="Gestante"
              size="small"
              color="info"
              variant="outlined"
            />
          )}
          {patient.allergies && (
            <Chip label="Alergias" size="small" variant="outlined" />
          )}
          {!patient.diabetes &&
            !patient.hypertension &&
            !patient.pregnancy &&
            !patient.allergies && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Sin antecedentes
              </Typography>
            )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onView(patient.id)}
          >
            Ver
          </Button>
          {canEdit && (
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={() => onEdit(patient)}
            >
              Editar
            </Button>
          )}
          {canDelete && (
            <Button
              size="small"
              color={patient.active ? "error" : "success"}
              startIcon={patient.active ? <DeleteIcon /> : <LockOpenIcon />}
              onClick={() => onToggleActive(patient)}
            >
              {patient.active ? "Desactivar" : "Reactivar"}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// PatientRow (desktop)
// ─────────────────────────────────────────────────────────────
const PatientRow = memo(function PatientRow({
  patient,
  onNavigate,
  onEdit,
  onToggleActive,
  canEdit,
  canDelete,
}) {
  const age = useMemo(() => calcAge(patient.birth_date), [patient.birth_date]);

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {patient.full_name}
        </Typography>
        {patient.email && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {patient.email}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography variant="body2">{patient.dni ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{age}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{patient.phone ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {patient.diabetes && (
            <Chip
              label="Diabetes"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {patient.hypertension && (
            <Chip label="HTA" size="small" color="error" variant="outlined" />
          )}
          {patient.pregnancy && (
            <Chip
              label="Gestante"
              size="small"
              color="info"
              variant="outlined"
            />
          )}
          {patient.allergies && (
            <Chip label="Alergias" size="small" variant="outlined" />
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={patient.active ? "Activo" : "Inactivo"}
          size="small"
          color={patient.active ? "success" : "default"}
          variant="outlined"
        />
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Ver ficha">
          <IconButton size="small" onClick={() => onNavigate(patient.id)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {canEdit && (
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(patient)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip title={patient.active ? "Desactivar" : "Reactivar"}>
            <IconButton size="small" onClick={() => onToggleActive(patient)}>
              {patient.active ? (
                <DeleteIcon fontSize="small" color="error" />
              ) : (
                <LockOpenIcon fontSize="small" color="success" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
});

// ─────────────────────────────────────────────────────────────
// DrawerFilterFields — solo el filtro activo/inactivo
// ─────────────────────────────────────────────────────────────
const DrawerFilterFields = memo(function DrawerFilterFields({
  filters,
  onChange,
}) {
  return (
    <TextField
      select
      label="Estado del paciente"
      name="activeStatus"
      size="small"
      fullWidth
      value={filters.activeStatus}
      onChange={onChange}
    >
      <MenuItem value="all">Todos</MenuItem>
      <MenuItem value="active">Activos</MenuItem>
      <MenuItem value="inactive">Inactivos</MenuItem>
    </TextField>
  );
});

// ─────────────────────────────────────────────────────────────
// PatientsPage
// ─────────────────────────────────────────────────────────────
export default function PatientsPage() {
  const navigate = useNavigate();
  const { can } = useRole();
  const { isMobile } = useBreakpoint();
  const {
    patients,
    total,
    loading,
    error,
    fetchPatients,
    togglePatientActive,
  } = usePatientStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [openForm, setOpenForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadAfterSave, setReloadAfterSave] = useState(false);

  // ── Búsqueda con debounce ─────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  // ── Filtro activo/inactivo ────────────────────────────────
  // activeStatus: valor comprometido (el que va al fetch)
  // localFilters: borrador del drawer antes de aplicar
  const [activeStatus, setActiveStatus] = useState("active");
  const [localFilters, setLocalFilters] = useState({ ...DRAWER_FILTERS_EMPTY });

  const { handleExcel, handlePdf } = usePatientsExport(
    debouncedSearch.length >= 3 ? debouncedSearch : "",
  );

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

  // ── Fetch central ─────────────────────────────────────────
  const load = useCallback(() => {
    const searchParam = debouncedSearch.length >= 3 ? debouncedSearch : "";
    fetchPatients({ search: searchParam, activeStatus, page, pageSize });
  }, [debouncedSearch, activeStatus, page, pageSize, fetchPatients]);

  // Aplica debounce al fetch: espera a que debouncedSearch,
  // activeStatus o paginación cambien para lanzar la consulta
  useEffect(() => {
    load();
  }, [load]);

  // Reset página cuando cambia la búsqueda o el filtro de estado
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeStatus]);

  // ── Permisos ──────────────────────────────────────────────
  const canEdit = useMemo(() => can(["ADMIN", "DOCTOR", "ASSISTANT"]), [can]);
  const canDelete = useMemo(() => can(["ADMIN"]), [can]);

  // ── slotProps dinámico para el buscador ───────────────────
  const handleClearSearch = useCallback(() => setSearchInput(""), []);
  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") handleClearSearch();
    },
    [handleClearSearch],
  );

  const searchSlotProps = useMemo(
    () => ({
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: searchInput ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClearSearch} edge="end">
              <CloseIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      },
    }),
    [searchInput, handleClearSearch],
  );

  // ── Conteo de filtros activos del drawer ──────────────────
  const activeFilterCount = useMemo(
    () => [activeStatus !== "all"].filter(Boolean).length,
    [activeStatus],
  );

  // ── Handlers memoizados ───────────────────────────────────
  const handleNavigate = useCallback(
    (id) => navigate("/patients/" + id),
    [navigate],
  );

  const handleEdit = useCallback((p) => {
    setEditTarget(p);
    setOpenForm(true);
  }, []);

  /*const handleDelete = useCallback(
    async (p) => {
      if (!window.confirm("¿Desactivar a " + p.full_name + "?")) return;
      const { error } = await deletePatient(p.id);
      if (error) setFeedback("Error: " + error);
      else {
        setFeedback("Paciente desactivado.");
        load();
      }
    },
    [deletePatient, load],
  );*/
  const handleToggleActive = useCallback(
    async (p) => {
      const action = p.active ? "desactivar" : "reactivar";
      if (!window.confirm(`¿Deseas ${action} a ${p.full_name}?`)) return;

      const { error } = await togglePatientActive(p.id, p.active);
      if (error) setFeedback("Error: " + error);
      else setFeedback(`Paciente ${p.active ? "desactivado" : "reactivado"}.`);
    },
    [togglePatientActive],
  );

  const handleOpenNew = useCallback(() => {
    setEditTarget(null);
    setOpenForm(true);
  }, []);

  const handleFormClose = useCallback(
    (saved) => {
      const wasEditing = !!editTarget;
      setOpenForm(false);
      setEditTarget(null);
      if (saved) {
        setFeedback(wasEditing ? "Paciente actualizado." : "Paciente creado.");
        setReloadAfterSave(true);
      }
    },
    [editTarget],
  );

  useEffect(() => {
    if (!reloadAfterSave) return;
    load();
    setReloadAfterSave(false);
  }, [reloadAfterSave, load]);

  const handlePageChange = useCallback((p) => setPage(p), []);
  const handlePageSizeChange = useCallback((ps) => {
    setPageSize(ps);
    setPage(1);
  }, []);
  const clearFeedback = useCallback(() => setFeedback(""), []);

  // Drawer handlers
  const handleFilterOpen = useCallback(() => {
    setLocalFilters({ activeStatus }); // sincroniza borrador con estado comprometido
    setFilterOpen(true);
  }, [activeStatus]);

  const handleFilterClose = useCallback(() => setFilterOpen(false), []);

  const handleLocalFilter = useCallback((e) => {
    const { name, value } = e.target;
    setLocalFilters((p) => ({ ...p, [name]: value }));
  }, []);

  const handleFilterApply = useCallback(() => {
    setActiveStatus(localFilters.activeStatus);
    setPage(1);
    setFilterOpen(false);
  }, [localFilters]);

  const handleFilterClear = useCallback(() => {
    setLocalFilters({ ...DRAWER_FILTERS_EMPTY });
    setActiveStatus("all");
    setPage(1);
    setFilterOpen(false);
  }, []);

  // ── Subtitle ──────────────────────────────────────────────
  const subtitle = useMemo(
    () => total + " registro" + (total !== 1 ? "s" : ""),
    [total],
  );

  // ── Acciones del header ───────────────────────────────────
  const headerActions = useMemo(
    () => (
      <>
        <ExportMenu
          onExcelExport={handleExcel}
          onPdfExport={handlePdf}
          totalRows={total}
          disabled={loading}
        />
        {can(["ADMIN", "ASSISTANT"]) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size={isMobile ? "small" : "medium"}
            onClick={handleOpenNew}
          >
            {isMobile ? "Nuevo" : "Nuevo paciente"}
          </Button>
        )}
      </>
    ),
    [handleExcel, handlePdf, total, loading, can, isMobile, handleOpenNew],
  );

  return (
    <Box>
      <PageHeader
        title="Pacientes"
        subtitle={subtitle}
        actions={headerActions}
      />

      {feedback && (
        <Alert
          severity={feedback.startsWith("Error") ? "error" : "success"}
          sx={{ mb: 2 }}
          onClose={clearFeedback}
        >
          {feedback}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
        {/* Desktop: búsqueda + select activo/inactivo en línea */}
        {!isMobile && (
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <TextField
              placeholder="Buscar por nombre o DNI..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              size="small"
              sx={{ flex: 1, maxWidth: 320 }}
              slotProps={searchSlotProps}
              helperText={
                searchInput.length > 0 && searchInput.length < 3
                  ? "Escribe al menos 3 caracteres"
                  : undefined
              }
            />
            <TextField
              select
              label="Estado"
              size="small"
              sx={{ minWidth: 140 }}
              value={activeStatus}
              onChange={(e) => {
                setActiveStatus(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
            </TextField>
          </Box>
        )}

        {/* Móvil: búsqueda + botón filtro en fila */}
        {isMobile && (
          <Box sx={{ display: "flex", gap: 1 /*, alignItems: "flex-start"*/ }}>
            <TextField
              placeholder="Buscar por nombre o DNI..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              size="small"
              slotProps={searchSlotProps}
              helperText={
                searchInput.length > 0 && searchInput.length < 3
                  ? "Mín. 3 caracteres"
                  : undefined
              }
              sx={{ flex: 1 }}
            />
            <FilterButton
              onClick={handleFilterOpen}
              activeCount={activeFilterCount}
            />
          </Box>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {isMobile ? (
            <Box>
              {patients.length === 0 ? (
                <Typography
                  sx={{ textAlign: "center", color: "text.secondary", mt: 4 }}
                >
                  No se encontraron pacientes
                </Typography>
              ) : (
                patients.map((p) => (
                  <PatientCard
                    key={p.id}
                    patient={p}
                    onView={handleNavigate}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))
              )}
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>DNI</TableCell>
                    <TableCell>Edad</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Antecedentes</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 4, color: "text.secondary" }}
                      >
                        No se encontraron pacientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((p) => (
                      <PatientRow
                        key={p.id}
                        patient={p}
                        onNavigate={handleNavigate}
                        onEdit={handleEdit}
                        onToggleActive={handleToggleActive}
                        canEdit={canEdit}
                        canDelete={canDelete}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* Drawer filtros móvil — solo activo/inactivo */}
      <FilterDrawer
        open={filterOpen}
        onClose={handleFilterClose}
        onApply={handleFilterApply}
        onClear={handleFilterClear}
        activeCount={activeFilterCount}
      >
        <DrawerFilterFields
          filters={localFilters}
          onChange={handleLocalFilter}
        />
      </FilterDrawer>

      <PatientFormModal
        open={openForm}
        patient={editTarget}
        onClose={handleFormClose}
      />
    </Box>
  );
}
