import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { supabase } from "../../services/supabaseClient";
import { useCatalogStore } from "../../stores/useCatalogStore";

const STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { treatments, fetchAll } = useCatalogStore();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    treatment_id: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
  });

  const set = (f) => (e) => setFilters((p) => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    fetchAll();
  }, []);
  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");

    let query = supabase
      .from("appointments_full")
      .select("*")
      .order("date", { ascending: false })
      .limit(200);

    if (filters.status !== "all") query = query.eq("status", filters.status);

    if (filters.treatment_id)
      query = query.eq("treatment_id", filters.treatment_id);

    if (filters.search.trim())
      query = query.or(
        `patient_name.ilike.%${filters.search}%,patient_dni.ilike.%${filters.search}%,doctor_name.ilike.%${filters.search}%`,
      );

    if (filters.dateFrom)
      query = query.gte("date", new Date(filters.dateFrom).toISOString());

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59);
      query = query.lte("date", to.toISOString());
    }

    const { data, error } = await query;
    if (error) setError(error.message);
    else setRows(data);
    setLoading(false);
  };

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleString("es-PE", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";

  return (
    <Box>
      <Typography variant="h6" fontWeight={500} mb={3}>
        Historial clínico
      </Typography>

      {/* Filtros */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            placeholder="Paciente, DNI o doctor..."
            value={filters.search}
            onChange={set("search")}
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
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            select
            label="Estado"
            value={filters.status}
            onChange={set("status")}
            size="small"
            fullWidth
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="atendido">Atendido</MenuItem>
            <MenuItem value="cancelado">Cancelado</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            select
            label="Tratamiento"
            value={filters.treatment_id}
            onChange={set("treatment_id")}
            size="small"
            fullWidth
          >
            <MenuItem value="">Todos</MenuItem>
            {treatments.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            label="Desde"
            type="date"
            value={filters.dateFrom}
            onChange={set("dateFrom")}
            size="small"
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            label="Hasta"
            type="date"
            value={filters.dateTo}
            onChange={set("dateTo")}
            size="small"
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mb={1}
      >
        {rows.length} registro{rows.length !== 1 ? "s" : ""} encontrado
        {rows.length !== 1 ? "s" : ""}
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell>Tratamiento</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Saldo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Notas</TableCell>
                <TableCell align="right">Ficha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="body2">{fmt(r.date)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {r.patient_name}
                    </Typography>
                    {r.patient_dni && (
                      <Typography variant="caption" color="text.secondary">
                        {r.patient_dni}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {r.treatment_name ?? "—"}
                    </Typography>
                    {r.specialty_name && (
                      <Typography variant="caption" color="text.secondary">
                        {r.specialty_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {r.doctor_name ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      S/ {Number(r.total).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      color={
                        Number(r.balance) > 0 ? "error.main" : "text.secondary"
                      }
                    >
                      S/ {Number(r.balance).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.status}
                      color={STATUS_COLOR[r.status] ?? "default"}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 160 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {r.notes ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      endIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={() => navigate(`/patients/${r.patient_id}`)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
