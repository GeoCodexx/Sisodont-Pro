import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Chip, CircularProgress, Alert,
  Card, CardContent, Typography, Avatar,
} from "@mui/material";
import AddIcon        from "@mui/icons-material/Add";
import SearchIcon     from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon       from "@mui/icons-material/Edit";
import DeleteIcon     from "@mui/icons-material/Delete";
import { usePatientStore }   from "../../stores/usePatientStore";
import { useRole }           from "../../hooks/useRole";
import { useBreakpoint }     from "../../hooks/useBreakpoint";
import PatientFormModal      from "./PatientFormModal";
import FilterDrawer          from "../../components/FilterDrawer";
import FilterButton          from "../../components/FilterButton";
import PageHeader            from "../../components/PageHeader";
import TablePagination       from "../../components/TablePagination";
import { usePatientsExport } from "../../hooks/usePatientsExport";
import ExportMenu            from "../../components/ExportMenu";

// ─────────────────────────────────────────────────────────────
// Helpers puros fuera del componente
// ─────────────────────────────────────────────────────────────
function calcAge(birth) {
  if (!birth) return "—";
  return (
    Math.floor((Date.now() - new Date(birth)) / (1000 * 60 * 60 * 24 * 365.25)) + " a"
  );
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// slotProps estables para el buscador — evita recrear objetos en cada render
const SEARCH_SLOT_PROPS = {
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon fontSize="small" />
      </InputAdornment>
    ),
  },
};

// ─────────────────────────────────────────────────────────────
// PatientCard (móvil) — memo: solo re-renderiza si el paciente
// o los permisos cambian. Sin memo, todo el listado re-renderiza
// al abrir/cerrar el formulario o al cambiar feedback.
// ─────────────────────────────────────────────────────────────
const PatientCard = memo(function PatientCard({
  patient, onView, onEdit, onDelete, canEdit, canDelete,
}) {
  const age = useMemo(() => calcAge(patient.birth_date), [patient.birth_date]);

  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 13 }}>
            {initials(patient.full_name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {patient.full_name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {patient.dni ? "DNI: " + patient.dni : "Sin DNI"} · {age}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
          {patient.diabetes    && <Chip label="Diabetes" size="small" color="warning" variant="outlined" />}
          {patient.hypertension && <Chip label="HTA"     size="small" color="error"   variant="outlined" />}
          {patient.pregnancy   && <Chip label="Gestante" size="small" color="info"    variant="outlined" />}
          {patient.allergies   && <Chip label="Alergias" size="small" variant="outlined" />}
          {!patient.diabetes && !patient.hypertension && !patient.pregnancy && !patient.allergies && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Sin antecedentes
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => onView(patient.id)}>
            Ver
          </Button>
          {canEdit && (
            <Button size="small" startIcon={<EditIcon />} onClick={() => onEdit(patient)}>
              Editar
            </Button>
          )}
          {canDelete && (
            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(patient)}>
              Desactivar
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// PatientRow (desktop) — memo + useMemo para calcAge
// Extraída del map inline para que memo sea efectivo
// ─────────────────────────────────────────────────────────────
const PatientRow = memo(function PatientRow({
  patient, onNavigate, onEdit, onDelete, canEdit, canDelete,
}) {
  const age = useMemo(() => calcAge(patient.birth_date), [patient.birth_date]);

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
          {patient.diabetes    && <Chip label="Diabetes" size="small" color="warning" variant="outlined" />}
          {patient.hypertension && <Chip label="HTA"     size="small" color="error"   variant="outlined" />}
          {patient.pregnancy   && <Chip label="Gestante" size="small" color="info"    variant="outlined" />}
          {patient.allergies   && <Chip label="Alergias" size="small" variant="outlined" />}
        </Box>
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
          <Tooltip title="Desactivar">
            <IconButton size="small" onClick={() => onDelete(patient)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
});

// ─────────────────────────────────────────────────────────────
// PatientsPage
// ─────────────────────────────────────────────────────────────
export default function PatientsPage() {
  const navigate   = useNavigate();
  const { can }    = useRole();
  const { isMobile } = useBreakpoint();
  const { patients, total, loading, error, fetchPatients, deletePatient } =
    usePatientStore();

  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(20);
  const [openForm,    setOpenForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [feedback,    setFeedback]    = useState("");
  const [filterOpen,  setFilterOpen]  = useState(false);

  const [reloadAfterSave, setReloadAfterSave] = useState(false);

  const { handleExcel, handlePdf } = usePatientsExport(search);

  // ── Fetch central ─────────────────────────────────────────
  const load = useCallback(() => {
    fetchPatients({ search, page, pageSize });
  }, [search, page, pageSize, fetchPatients]);

  // Reset página cuando cambia la búsqueda
  useEffect(() => { setPage(1); }, [search]);

  // Debounce: 300ms para búsqueda, inmediato para cambio de página
  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  // ── Permisos — memoizados para referencia estable en filas ─
  const canEdit   = useMemo(() => can(["ADMIN", "DOCTOR", "ASSISTANT"]), [can]);
  const canDelete = useMemo(() => can(["ADMIN"]),                         [can]);

  // ── Handlers memoizados ───────────────────────────────────
  const handleNavigate = useCallback(
    (id) => navigate("/patients/" + id),
    [navigate],
  );

  const handleEdit = useCallback((p) => {
    setEditTarget(p);
    setOpenForm(true);
  }, []);

  const handleDelete = useCallback(async (p) => {
    if (!window.confirm("¿Desactivar a " + p.full_name + "?")) return;
    const { error } = await deletePatient(p.id);
    if (error) setFeedback("Error: " + error);
    else {
      setFeedback("Paciente desactivado.");
      load();
    }
  }, [deletePatient, load]);

  const handleOpenNew = useCallback(() => {
    setEditTarget(null);
    setOpenForm(true);
  }, []);

  /*const handleFormClose = useCallback((saved) => {
    setOpenForm(false);
    // Leer editTarget con ref para no incluirlo en deps y evitar
    // que el callback se recree cuando cambia editTarget
    setEditTarget((prev) => {
      if (saved) {
        setFeedback(prev ? "Paciente actualizado." : "Paciente creado.");
        load();
      }
      return null;
    });
  }, [load]);*/
  const handleFormClose = useCallback((saved) => {
  const wasEditing = !!editTarget;

  setOpenForm(false);
  setEditTarget(null);

  if (saved) {
    setFeedback(
      wasEditing
        ? "Paciente actualizado."
        : "Paciente creado."
    );

    setReloadAfterSave(true);
  }
}, [editTarget]);

useEffect(() => {
  if (!reloadAfterSave) return;

  load();
  setReloadAfterSave(false);
}, [reloadAfterSave, load]);

  const handlePageChange     = useCallback((p)  => setPage(p),                     []);
  const handlePageSizeChange = useCallback((ps) => { setPageSize(ps); setPage(1); }, []);
  const handleFilterClose    = useCallback(() => setFilterOpen(false),               []);
  const handleFilterApply    = useCallback(() => setFilterOpen(false),               []);
  const handleFilterClear    = useCallback(() => setSearch(""),                      []);
  const handleFilterOpen     = useCallback(() => setFilterOpen(true),                []);
  const handleSearchChange   = useCallback((e) => setSearch(e.target.value),         []);
  const clearFeedback        = useCallback(() => setFeedback(""),                    []);

  // ── Subtitle memoizado ────────────────────────────────────
  const subtitle = useMemo(
    () => total + " registro" + (total !== 1 ? "s" : ""),
    [total],
  );

  // ── Acciones del header memoizadas ────────────────────────
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
      <PageHeader title="Pacientes" subtitle={subtitle} actions={headerActions} />

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
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Barra de búsqueda */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={handleSearchChange}
          size="small"
          sx={{ flex: 1, maxWidth: { sm: 320 } }}
          slotProps={SEARCH_SLOT_PROPS}
        />
        {isMobile && (
          <FilterButton onClick={handleFilterOpen} activeCount={search ? 1 : 0} />
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Vista móvil */}
          {isMobile ? (
            <Box>
              {patients.length === 0 ? (
                <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 4 }}>
                  No se encontraron pacientes
                </Typography>
              ) : (
                patients.map((p) => (
                  <PatientCard
                    key={p.id}
                    patient={p}
                    onView={handleNavigate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    canEdit={canEdit}
                    canDelete={canDelete}
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
                    <TableCell>Nombre</TableCell>
                    <TableCell>DNI</TableCell>
                    <TableCell>Edad</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Antecedentes</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
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
                        onDelete={handleDelete}
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

      {/* Drawer filtros móvil */}
      <FilterDrawer
        open={filterOpen}
        onClose={handleFilterClose}
        onApply={handleFilterApply}
        onClear={handleFilterClear}
        activeCount={search ? 1 : 0}
      >
        <TextField
          label="Buscar por nombre o DNI"
          value={search}
          onChange={handleSearchChange}
          size="small"
          fullWidth
          slotProps={SEARCH_SLOT_PROPS}
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