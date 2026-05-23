import { useEffect, useState, useCallback, useMemo, memo } from "react";
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
  Avatar,
  Stack,
  Divider,
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
import TablePagination from "../../components/TablePagination";

import { useHistoryExport } from "../../hooks/useHistoryExport";

// ─────────────────────────────────────────────────────────────
// Constantes estáticas fuera del componente
// ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};

const EMPTY_FILTERS = {
  search: "",
  status: "all",
  treatment_id: "",
  dateFrom: "",
  dateTo: "",
};

// Helpers puros — no dependen de estado ni props
function fmt(iso) {
  return iso
    ? new Date(iso).toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
}

function fmtMoney(value) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

// ─────────────────────────────────────────────────────────────
// HistoryCard — memo: evita re-render de cada tarjeta cuando
// cambia la paginación, los filtros u otro estado del padre.
// ─────────────────────────────────────────────────────────────
const HistoryCard = memo(function HistoryCard({ row, onView }) {
  const hasDebt = Number(row.balance) > 0;
  const isMulti = !!row.case_id;

  // useCallback: referencia estable — onView no cambia entre renders
  const handleView = useCallback(() => onView(row.patient_id), [onView, row.patient_id]);

  return (
    <Card variant="outlined" sx={{ mb: 1.5, borderRadius: 3, overflow: "hidden" }}>
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.2, minWidth: 0, flex: 1 }}>
            <Avatar sx={{ width: 40, height: 40 }}>
              {row.patient_name?.[0] ?? "P"}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {row.patient_name}
              </Typography>
              {row.patient_dni && (
                <Typography variant="caption" color="text.secondary">
                  DNI: {row.patient_dni}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary" }}
              >
                {fmt(row.date)}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={row.status}
            color={STATUS_COLOR[row.status] ?? "default"}
            size="small"
            sx={{ textTransform: "capitalize", fontWeight: 500 }}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Body */}
        <Stack spacing={1}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Tratamiento
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                {row.treatment_name ?? "—"}
              </Typography>
            </Box>
            <Chip
              size="small"
              variant="outlined"
              color={isMulti ? "primary" : "default"}
              label={isMulti ? "Multisesión" : "Única"}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Doctor
            </Typography>
            <Typography variant="body2">{row.doctor_name ?? "—"}</Typography>
          </Box>

          {row.specialty_name && (
            <Box>
              <Chip
                size="small"
                label={row.specialty_name}
                variant="outlined"
              />
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pt: 0.5,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Costo
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {isMulti ? "—" : fmtMoney(row.total)}
              </Typography>
            </Box>
            {!isMulti && (
              <Chip
                size="small"
                color={hasDebt ? "error" : "success"}
                variant="outlined"
                label={hasDebt ? `Debe ${fmtMoney(row.balance)}` : "Pagado"}
              />
            )}
          </Box>

          {row.notes && (
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
              {row.notes}
            </Typography>
          )}
        </Stack>

        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
          <Button
            size="small"
            endIcon={<OpenInNewIcon fontSize="small" />}
            onClick={handleView}
          >
            Ver ficha
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// HistoryRow — memo: evita re-render de cada fila de la tabla
// cuando cambia la paginación u otro estado del padre.
// ─────────────────────────────────────────────────────────────
const HistoryRow = memo(function HistoryRow({ r, onNavigate }) {
  const hasDebt = Number(r.balance) > 0;
  const isMulti = !!r.case_id;

  const handleRowClick = useCallback(
    () => onNavigate(r.patient_id),
    [onNavigate, r.patient_id],
  );

  const handleBtnClick = useCallback(
    (e) => {
      e.stopPropagation();
      onNavigate(r.patient_id);
    },
    [onNavigate, r.patient_id],
  );

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      sx={{
        cursor: "pointer",
        transition: "0.15s",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {/* Paciente */}
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {r.patient_name}
            </Typography>
            {r.patient_dni && (
              <Typography variant="caption" color="text.secondary">
                DNI: {r.patient_dni}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>

      {/* Tratamiento */}
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {r.treatment_name ?? "—"}
        </Typography>
        {r.specialty_name && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {r.specialty_name}
          </Typography>
        )}
      </TableCell>

      {/* Fecha */}
      <TableCell>
        <Typography variant="body2">{fmt(r.date)}</Typography>
      </TableCell>

      {/* Tipo */}
      <TableCell>
        <Chip
          size="small"
          variant="outlined"
          color={isMulti ? "primary" : "default"}
          label={isMulti ? "Multisesión" : "Única"}
        />
      </TableCell>

      {/* Pago */}
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {isMulti ? "—" : fmtMoney(r.total)}
        </Typography>
        {!isMulti && (
          <Chip
            size="small"
            color={hasDebt ? "error" : "success"}
            variant="outlined"
            label={hasDebt ? `Debe ${fmtMoney(r.balance)}` : "Pagado"}
            sx={{ mt: 0.5 }}
          />
        )}
      </TableCell>

      {/* Estado */}
      <TableCell>
        <Chip
          label={r.status}
          color={STATUS_COLOR[r.status] ?? "default"}
          size="small"
          sx={{ textTransform: "capitalize", fontWeight: 500 }}
        />
      </TableCell>

      {/* Acción */}
      <TableCell align="right">
        <Button
          size="small"
          endIcon={<OpenInNewIcon fontSize="small" />}
          onClick={handleBtnClick}
        >
          Ver
        </Button>
      </TableCell>
    </TableRow>
  );
});

// ─────────────────────────────────────────────────────────────
// KpiCard — memo: presentacional puro, nunca re-renderiza solo
// ─────────────────────────────────────────────────────────────
const KpiCard = memo(function KpiCard({ label, value, color }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" color={color ?? "text.primary"} sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// HistoryPage
// ─────────────────────────────────────────────────────────────
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

  useEffect(() => { fetchAll(); }, []);

  // ── Setter genérico para filtros aplicados (desktop inline) ─
  // useCallback: referencia estable — no recreada en cada render
  const setF = useCallback(
    (k) => (v) => setFilters((p) => ({ ...p, [k]: v })),
    [],
  );

  // ── Setter genérico para filtros locales (drawer móvil) ────
  const setLocal = useCallback(
    (k) => (v) => setLocalFilters((p) => ({ ...p, [k]: v })),
    [],
  );

  // ── Carga de datos ─────────────────────────────────────────
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
    if (filters.treatment_id) query = query.eq("treatment_id", filters.treatment_id);
    if (filters.search.trim()) {
      query = query.or(
        `patient_name.ilike.%${filters.search}%,patient_dni.ilike.%${filters.search}%,doctor_name.ilike.%${filters.search}%`,
      );
    }
    if (filters.dateFrom)
      query = query.gte("date", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo) {
      const d = new Date(filters.dateTo);
      d.setHours(23, 59, 59);
      query = query.lte("date", d.toISOString());
    }

    const { data, error, count } = await query;
    if (error) setError(error.message);
    else { setRows(data ?? []); setTotal(count ?? 0); }
    setLoading(false);
  }, [page, pageSize, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filters]);

  // ── Handlers estables ──────────────────────────────────────
  const applyFilters = useCallback(() => {
    setFilters({ ...localFilters });
    setFilterOpen(false);
  }, [localFilters]);

  const clearFilters = useCallback(() => {
    setLocalFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  }, []);

  const handleOpenFilter = useCallback(() => {
    setLocalFilters({ ...filters });
    setFilterOpen(true);
  }, [filters]);

  const handleCloseFilter = useCallback(() => setFilterOpen(false), []);

  const handleNavigate = useCallback(
    (patientId) => navigate("/patients/" + patientId),
    [navigate],
  );

  const handlePageChange = useCallback((p) => setPage(p), []);

  const handlePageSizeChange = useCallback((ps) => {
    setPageSize(ps);
    setPage(1);
  }, []);

  // ── Derivados con useMemo ───────────────────────────────────
  // KPIs: recalculan solo cuando rows cambia
  const { attendedCount, pendingCount, cancelledCount } = useMemo(
    () => ({
      attendedCount: rows.filter((r) => r.status === "atendido").length,
      pendingCount: rows.filter((r) => r.status === "pendiente").length,
      cancelledCount: rows.filter((r) => r.status === "cancelado").length,
    }),
    [rows],
  );

  // Contador de filtros activos
  const activeFilterCount = useMemo(
    () =>
      [
        !!filters.search,
        filters.status !== "all",
        !!filters.treatment_id,
        !!filters.dateFrom,
        !!filters.dateTo,
      ].filter(Boolean).length,
    [filters],
  );

  // ── filterFields: función que produce los campos del drawer ─
  // Se envuelve en useCallback para no recrear la función en
  // cada render. Los campos leen localFilters y setLocal.
  const filterFields = useCallback(
    (f, set) => (
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
    ),
    [treatments],
  );

  // ── Subtitle memoizado ─────────────────────────────────────
  const subtitle = useMemo(
    () => `${total} registro${total !== 1 ? "s" : ""}`,
    [total],
  );

  return (
    <Box>
      <PageHeader
        title="Historial clínico"
        subtitle={subtitle}
        actions={
          <ExportMenu
            onExcelExport={handleExcel}
            onPdfExport={handlePdf}
            totalRows={total}
            disabled={loading}
          />
        }
      />

      {/* KPIs */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Total" value={total} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Atendidas" value={attendedCount} color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Pendientes" value={pendingCount} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Canceladas" value={cancelledCount} color="error.main" />
        </Grid>
      </Grid>

      {/* Filtros inline — desktop */}
      {!isMobile && (
        <Card variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Grid size={{ xs: 6, md: 2 }}>
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
              <Grid size={{ xs: 6, md: 2 }}>
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
              <Grid size={{ xs: 6, md: 2 }}>
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
              <Grid size={{ xs: 6, md: 2 }}>
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
          </CardContent>
        </Card>
      )}

      {/* Botón filtros — móvil */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <FilterButton
            onClick={handleOpenFilter}
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
                <Typography color="text.secondary" mt={4} sx={{ textAlign: "center" }}>
                  No se encontraron registros
                </Typography>
              ) : (
                rows.map((r) => (
                  <HistoryCard key={r.id} row={r} onView={handleNavigate} />
                ))
              )}
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Tratamiento</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Pago</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Ficha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{ py: 5, color: "text.secondary" }}
                      >
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((r) => (
                    <HistoryRow key={r.id} r={r} onNavigate={handleNavigate} />
                  ))}
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

      <FilterDrawer
        open={filterOpen}
        onClose={handleCloseFilter}
        onApply={applyFilters}
        onClear={clearFilters}
        activeCount={activeFilterCount}
      >
        {filterFields(localFilters, setLocal)}
      </FilterDrawer>
    </Box>
  );
}