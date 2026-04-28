import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { usePatientStore } from "../../stores/usePatientStore";
import { useRole } from "../../hooks/useRole";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import PatientFormModal from "./PatientFormModal";
import FilterDrawer from "../../components/FilterDrawer";
import FilterButton from "../../components/FilterButton";
import PageHeader from "../../components/PageHeader";
import TablePagination from "../../components/TablePagination";
import { usePatientsExport } from "../../hooks/usePatientsExport";
import ExportMenu from "../../components/ExportMenu";

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

function PatientCard({
  patient,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
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
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {patient.full_name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {patient.dni ? "DNI: " + patient.dni : "Sin DNI"} ·{" "}
              {calcAge(patient.birth_date)}
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
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(patient)}
            >
              Desactivar
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const { can } = useRole();
  const { isMobile } = useBreakpoint();
  const { patients, total, loading, error, fetchPatients, deletePatient } =
    usePatientStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [openForm, setOpenForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const { handleExcel, handlePdf } = usePatientsExport(search);

  // Fetch central — se llama cada vez que cambian search, page o pageSize
  const load = useCallback(() => {
    fetchPatients({ search, page, pageSize });
  }, [search, page, pageSize]);

  // Debounce en search; reset de página
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleEdit = (p) => {
    setEditTarget(p);
    setOpenForm(true);
  };
  const handleDelete = async (p) => {
    if (!window.confirm("¿Desactivar a " + p.full_name + "?")) return;
    const { error } = await deletePatient(p.id);
    if (error) setFeedback("Error: " + error);
    else {
      setFeedback("Paciente desactivado.");
      load();
    }
  };
  const handleFormClose = (saved) => {
    setOpenForm(false);
    setEditTarget(null);
    if (saved) {
      setFeedback(editTarget ? "Paciente actualizado." : "Paciente creado.");
      load();
    }
  };

  return (
    <Box>
      <PageHeader
        title="Pacientes"
        subtitle={total + " registro" + (total !== 1 ? "s" : "")}
        actions={
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
                onClick={() => {
                  setEditTarget(null);
                  setOpenForm(true);
                }}
              >
                {isMobile ? "Nuevo" : "Nuevo paciente"}
              </Button>
            )}
          </>
        }
      />

      {feedback && (
        <Alert
          severity={feedback.startsWith("Error") ? "error" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setFeedback("")}
        >
          {feedback}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Barra de búsqueda */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, maxWidth: { sm: 320 } }}
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
        {isMobile && (
          <FilterButton
            onClick={() => setFilterOpen(true)}
            activeCount={search ? 1 : 0}
          />
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
                    onView={(id) => navigate("/patients/" + id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    canEdit={can(["ADMIN", "DOCTOR", "ASSISTANT"])}
                    canDelete={can(["ADMIN"])}
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
                  {patients.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 4, color: "text.secondary" }}
                      >
                        No se encontraron pacientes
                      </TableCell>
                    </TableRow>
                  )}
                  {patients.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {p.full_name}
                        </Typography>
                        {p.email && (
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {p.email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{p.dni ?? "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {calcAge(p.birth_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {p.phone ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                        >
                          {p.diabetes && (
                            <Chip
                              label="Diabetes"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                          {p.hypertension && (
                            <Chip
                              label="HTA"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                          {p.pregnancy && (
                            <Chip
                              label="Gestante"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                          {p.allergies && (
                            <Chip
                              label="Alergias"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver ficha">
                          <IconButton
                            size="small"
                            onClick={() => navigate("/patients/" + p.id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {can(["ADMIN", "DOCTOR", "ASSISTANT"]) && (
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(p)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {can(["ADMIN"]) && (
                          <Tooltip title="Desactivar">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(p)}
                            >
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Paginación server-side */}
          <TablePagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(ps) => {
              setPageSize(ps);
              setPage(1);
            }}
          />
        </>
      )}

      {/* Drawer filtros móvil */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={() => setFilterOpen(false)}
        onClear={() => setSearch("")}
        activeCount={search ? 1 : 0}
      >
        <TextField
          label="Buscar por nombre o DNI"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
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
      </FilterDrawer>

      <PatientFormModal
        open={openForm}
        patient={editTarget}
        onClose={handleFormClose}
      />
    </Box>
  );
}
