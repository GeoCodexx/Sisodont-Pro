import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { usePatientStore } from "../../stores/usePatientStore";
import { useRole } from "../../hooks/useRole";
import PatientFormModal from "./PatientFormModal";

export default function PatientsPage() {
  const navigate = useNavigate();
  const { can } = useRole();
  const { patients, loading, error, fetchPatients, deletePatient } =
    usePatientStore();

  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => fetchPatients(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleEdit = (patient) => {
    setEditTarget(patient);
    setOpenForm(true);
  };

  const handleDelete = async (patient) => {
    if (!window.confirm(`¿Desactivar a ${patient.full_name}?`)) return;
    const { error } = await deletePatient(patient.id);
    if (error) setFeedback("Error al desactivar: " + error);
    else setFeedback("Paciente desactivado correctamente.");
  };

  const handleFormClose = (saved) => {
    setOpenForm(false);
    setEditTarget(null);
    if (saved) {
      setFeedback(editTarget ? "Paciente actualizado." : "Paciente creado.");
      fetchPatients(search);
    }
  };

  const calcAge = (birth) => {
    if (!birth) return "—";
    const diff = Date.now() - new Date(birth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + " años";
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" fontWeight={500}>
          Pacientes
        </Typography>
        {can(["ADMIN", "ASSISTANT"]) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditTarget(null);
              setOpenForm(true);
            }}
          >
            Nuevo paciente
          </Button>
        )}
      </Box>

      {feedback && (
        <Alert
          severity={feedback.startsWith("Error") ? "error" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setFeedback("")}
        >
          {feedback}
        </Alert>
      )}

      <TextField
        placeholder="Buscar por nombre o DNI..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: 320 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
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
                    <Typography variant="body2" fontWeight={500}>
                      {p.full_name}
                    </Typography>
                    {p.email && (
                      <Typography variant="caption" color="text.secondary">
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
                    <Typography variant="body2">{p.phone ?? "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
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
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver ficha">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/patients/${p.id}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {can(["ADMIN", "DOCTOR", "ASSISTANT"]) && (
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(p)}>
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

      <PatientFormModal
        open={openForm}
        patient={editTarget}
        onClose={handleFormClose}
      />
    </Box>
  );
}
