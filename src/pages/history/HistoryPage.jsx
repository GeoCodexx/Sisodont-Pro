import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  MenuItem,
  Grid,
  Button,
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
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { supabase } from "../../services/supabaseClient";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import FilterDrawer from "../../components/FilterDrawer";
import FilterButton from "../../components/FilterButton";
import PageHeader from "../../components/PageHeader";
import ExportMenu from "../../components/ExportMenu";
import { useHistoryExport } from "../../hooks/useHistoryExport";
import TablePagination from "../../components/TablePagination";

const STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};

function fmt(iso) {
  return iso
    ? new Date(iso).toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
}

function HistoryCard({ row, onView }) {
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
            <Typography variant="body2" fontWeight={500} noWrap>
              {row.patient_name}
            </Typography>
            {row.patient_dni && (
              <Typography variant="caption" color="text.secondary">
                {row.patient_dni}
              </Typography>
            )}
          </Box>
          <Chip
            label={row.status}
            color={STATUS_COLOR[row.status] ?? "default"}
            size="small"
            sx={{ textTransform: "capitalize", ml: 1 }}
          />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          {fmt(row.date)} · {row.doctor_name ?? "—"}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="body2">{row.treatment_name ?? "—"}</Typography>
            {row.specialty_name && (
              <Typography variant="caption" color="text.secondary">
                {row.specialty_name}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" fontWeight={500}>
              S/ {Number(row.total).toFixed(2)}
            </Typography>
            {Number(row.balance) > 0 && (
              <Typography variant="caption" color="error.main">
                Debe: S/ {Number(row.balance).toFixed(2)}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button
            size="small"
            endIcon={<OpenInNewIcon fontSize="small" />}
            onClick={() => onView(row.patient_id)}
          >
            Ver ficha
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

const EMPTY_FILTERS = {
  search: "",
  status: "all",
  treatment_id: "",
  dateFrom: "",
  dateTo: "",
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { treatments, fetchAll } = useCatalogStore();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [localFilters, setLocalFilters] = useState(EMPTY_FILTERS);
  const { handleExcel, handlePdf } = useHistoryExport(filters);

  const setF = (k) => (v) => setFilters((p) => ({ ...p, [k]: v }));
  const setLocal = (k) => (v) => setLocalFilters((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetchAll();
  }, []);

  // Fetch server-side con paginación + filtros
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("appointments_full")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })
      .range(from, to);

    if (filters.status !== "all") query = query.eq("status", filters.status);
    if (filters.treatment_id)
      query = query.eq("treatment_id", filters.treatment_id);
    if (filters.search.trim())
      query = query.or(
        "patient_name.ilike.%" +
          filters.search +
          "%,patient_dni.ilike.%" +
          filters.search +
          "%,doctor_name.ilike.%" +
          filters.search +
          "%",
      );
    if (filters.dateFrom)
      query = query.gte("date", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo) {
      const d = new Date(filters.dateTo);
      d.setHours(23, 59, 59);
      query = query.lte("date", d.toISOString());
    }

    const { data, error, count } = await query;
    if (error) setError(error.message);
    else {
      setRows(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const applyFilters = () => {
    setFilters({ ...localFilters });
    setFilterOpen(false);
  };
  const clearFilters = () => {
    setLocalFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  const activeFilterCount = [
    !!filters.search,
    filters.status !== "all",
    !!filters.treatment_id,
    !!filters.dateFrom,
    !!filters.dateTo,
  ].filter(Boolean).length;

  const filterFields = (f, set) => (
    <>
      <TextField
        label="Paciente, DNI o doctor"
        size="small"
        fullWidth
        value={f.search}
        onChange={(e) => set("search")(e.target.value)}
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
      <TextField
        select
        label="Estado"
        size="small"
        fullWidth
        value={f.status}
        onChange={(e) => set("status")(e.target.value)}
      >
        <MenuItem value="all">Todos</MenuItem>
        <MenuItem value="pendiente">Pendiente</MenuItem>
        <MenuItem value="atendido">Atendido</MenuItem>
        <MenuItem value="cancelado">Cancelado</MenuItem>
      </TextField>
      <TextField
        select
        label="Tratamiento"
        size="small"
        fullWidth
        value={f.treatment_id}
        onChange={(e) => set("treatment_id")(e.target.value)}
      >
        <MenuItem value="">Todos</MenuItem>
        {treatments.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Desde"
        type="date"
        size="small"
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
        value={f.dateFrom}
        onChange={(e) => set("dateFrom")(e.target.value)}
      />
      <TextField
        label="Hasta"
        type="date"
        size="small"
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
        value={f.dateTo}
        onChange={(e) => set("dateTo")(e.target.value)}
      />
    </>
  );

  return (
    <Box>
      <PageHeader
        title="Historial clínico"
        subtitle={total + " registro" + (total !== 1 ? "s" : "")}
        actions={
          <ExportMenu
            onExcelExport={handleExcel}
            onPdfExport={handlePdf}
            totalRows={total}
            disabled={loading}
          />
        }
      />

      {/* Filtros desktop */}
      {!isMobile && (
        <Grid container spacing={1.5} mb={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Paciente, DNI o doctor..."
              value={filters.search}
              onChange={(e) => setF("search")(e.target.value)}
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
              size="small"
              fullWidth
              value={filters.status}
              onChange={(e) => setF("status")(e.target.value)}
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
              size="small"
              fullWidth
              value={filters.treatment_id}
              onChange={(e) => setF("treatment_id")(e.target.value)}
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
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.dateFrom}
              onChange={(e) => setF("dateFrom")(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              label="Hasta"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.dateTo}
              onChange={(e) => setF("dateTo")(e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <FilterButton
            onClick={() => {
              setLocalFilters({ ...filters });
              setFilterOpen(true);
            }}
            activeCount={activeFilterCount}
          />
        </Box>
      )}

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
        <>
          {isMobile ? (
            <Box>
              {rows.length === 0 ? (
                <Typography
                  color="text.secondary"
                  mt={4}
                  sx={{ textAlign: "center" }}
                >
                  No se encontraron registros
                </Typography>
              ) : (
                rows.map((r) => (
                  <HistoryCard
                    key={r.id}
                    row={r}
                    onView={(id) => navigate("/patients/" + id)}
                  />
                ))
              )}
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
                            Number(r.balance) > 0
                              ? "error.main"
                              : "text.secondary"
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
                          onClick={() => navigate("/patients/" + r.patient_id)}
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

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
        onClear={clearFilters}
        activeCount={activeFilterCount}
      >
        {filterFields(localFilters, setLocal)}
      </FilterDrawer>
    </Box>
  );
}
