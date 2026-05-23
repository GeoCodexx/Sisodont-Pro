import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Box, TextField, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Chip, CircularProgress, Alert,
  Card, CardContent, Typography, InputAdornment,
} from "@mui/material";
import SearchIcon     from "@mui/icons-material/Search";
import ReceiptIcon    from "@mui/icons-material/Receipt";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { usePaymentsPageStore } from "../../stores/usePaymentsPageStore";
import { useBreakpoint }        from "../../hooks/useBreakpoint";
import PaymentDetailModal       from "./PaymentDetailModal";
import FilterDrawer             from "../../components/FilterDrawer";
import FilterButton             from "../../components/FilterButton";
import PageHeader               from "../../components/PageHeader";
import TablePagination          from "../../components/TablePagination";

// ─────────────────────────────────────────────────────────────
// Constantes fuera del componente
// ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pendiente:  "warning",
  atendido:   "success",
  cancelado:  "error",
  en_curso:   "primary",
  completado: "success",
  abandonado: "default",
};

const FILTERS_EMPTY = {
  status: "all", balance: "all", search: "",
  dateFrom: "", dateTo: "", refType: "all",
};

// Formatter instanciado una sola vez
const dateFormatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "short" });
const solesFormatter = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2 });

const fmt   = (iso) => (iso ? dateFormatter.format(new Date(iso)) : "—");
const fmtS  = (n)   => `S/ ${solesFormatter.format(Number(n ?? 0))}`;

// Función pura — no necesita estar en el componente
const balanceColor = (b) => (Number(b) > 0 ? "error.main" : "success.main");

// slotProps estables — evitan recrear objetos en cada render de TextField
const SEARCH_SLOT = {
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon fontSize="small" />
      </InputAdornment>
    ),
  },
};
const DATE_FROM_SLOT = { inputLabel: { shrink: true } };
const AMOUNT_SLOT = {
  htmlInput: { min: 0.01, step: "0.01" },
  input: { startAdornment: <InputAdornment position="start">S/</InputAdornment> },
};

// ─────────────────────────────────────────────────────────────
// KpiCard — memo: recibe solo primitivos, bailout efectivo
// ─────────────────────────────────────────────────────────────
const KpiCard = memo(function KpiCard({ label, value, color }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: "16px !important" }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography
          variant="h6"
          fontWeight={500}
          sx={{ mt: 0.5, color: color ?? "text.primary" }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// TypeChip — memo: solo re-renderiza si type cambia
// ─────────────────────────────────────────────────────────────
const TypeChip = memo(function TypeChip({ type }) {
  return type === "case" ? (
    <Chip
      icon={<FolderOpenIcon sx={{ fontSize: "14px !important" }} />}
      label="Multisesión"
      size="small"
      color="primary"
      variant="outlined"
      sx={{ fontSize: 11 }}
    />
  ) : (
    <Chip
      icon={<ReceiptIcon sx={{ fontSize: "14px !important" }} />}
      label="Cita única"
      size="small"
      variant="outlined"
      sx={{ fontSize: 11 }}
    />
  );
});

// ─────────────────────────────────────────────────────────────
// PaymentCard (móvil) — memo + valores derivados memoizados
// ─────────────────────────────────────────────────────────────
const PaymentCard = memo(function PaymentCard({ row, onDetail }) {
  const balance  = useMemo(() => Number(row.balance),           [row.balance]);
  const billed   = useMemo(() => fmtS(row.billed),             [row.billed]);
  const collected = useMemo(() => fmtS(row.collected),          [row.collected]);
  const balFmt   = useMemo(() => fmtS(balance),                [balance]);
  const date     = useMemo(() => fmt(row.date),                 [row.date]);
  const bColor   = useMemo(() => balanceColor(balance),         [balance]);
  const costLabel = row.ref_type === "case" ? "Costo total" : "Total";

  const handleDetail = useCallback(() => onDetail(row), [onDetail, row]);

  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {row.patient_name}
            </Typography>
            {row.patient_dni && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {row.patient_dni}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, ml: 1, flexShrink: 0 }}>
            <TypeChip type={row.ref_type} />
            <Chip
              label={row.status}
              color={STATUS_COLOR[row.status] ?? "default"}
              size="small"
              sx={{ textTransform: "capitalize" }}
            />
          </Box>
        </Box>

        <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
          {row.treatment_name ?? "—"} · {row.doctor_name ?? "—"} · {date}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                {costLabel}
              </Typography>
              <Typography variant="body2" fontWeight={500}>{billed}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                Pagado
              </Typography>
              <Typography variant="body2" sx={{ color: "success.main" }}>{collected}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                Saldo
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ color: bColor }}>
                {balFmt}
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Ver detalle de pagos">
            <IconButton size="small" onClick={handleDetail}>
              {row.ref_type === "case"
                ? <FolderOpenIcon fontSize="small" />
                : <ReceiptIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// PaymentRow (desktop) — memo + valores derivados memoizados
// Extraída del map inline para que memo sea efectivo
// ─────────────────────────────────────────────────────────────
const PaymentRow = memo(function PaymentRow({ row, onDetail }) {
  const date      = useMemo(() => fmt(row.date),          [row.date]);
  const billed    = useMemo(() => fmtS(row.billed),       [row.billed]);
  const collected = useMemo(() => fmtS(row.collected),    [row.collected]);
  const balance   = useMemo(() => fmtS(row.balance),      [row.balance]);
  const bColor    = useMemo(() => balanceColor(row.balance), [row.balance]);

  // Determinar si es caso o cita — estable si row.payment_type no cambia
  const isCase       = row.payment_type === "case";
  const rowBgColor   = isCase ? "primary.main08" : "inherit";
  const detailTitle  = isCase ? "Ver pagos del caso" : "Ver pagos de la cita";

  const handleDetail = useCallback(() => onDetail(row), [onDetail, row]);

  return (
    <TableRow
      hover
      sx={{ bgcolor: isCase ? "rgba(25,118,210,0.03)" : "inherit" }}
    >
      <TableCell><TypeChip type={row.ref_type} /></TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={500}>{row.patient_name}</Typography>
        {row.patient_dni && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.patient_dni}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography variant="body2">{row.treatment_name ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{row.doctor_name ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{date}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{billed}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ color: "success.main" }}>{collected}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={500} sx={{ color: bColor }}>
          {balance}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={row.status}
          color={STATUS_COLOR[row.status] ?? "default"}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      </TableCell>
      <TableCell align="right">
        <Tooltip title={detailTitle}>
          <IconButton size="small" onClick={handleDetail}>
            {isCase
              ? <FolderOpenIcon fontSize="small" color="primary" />
              : <ReceiptIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

// ─────────────────────────────────────────────────────────────
// FilterFields — componente memoizado para el drawer móvil.
// Antes era una función `filterFields(f, set)` llamada dentro
// del JSX — eso significa que React la trata como un nuevo
// componente en cada render y desmonta/remonta todo el árbol.
// Como componente memoizado con props estables, solo re-renderiza
// cuando localFilters cambia.
// ─────────────────────────────────────────────────────────────
const FilterFields = memo(function FilterFields({ filters, onChange }) {
  return (
    <>
      <TextField
        label="Buscar paciente o DNI"
        name="search"
        size="small"
        fullWidth
        value={filters.search}
        onChange={onChange}
        slotProps={SEARCH_SLOT}
      />
      <TextField
        select
        label="Tipo"
        name="refType"
        size="small"
        fullWidth
        value={filters.refType}
        onChange={onChange}
      >
        <MenuItem value="all">Todos</MenuItem>
        <MenuItem value="appointment">Cita única</MenuItem>
        <MenuItem value="case">Multisesión</MenuItem>
      </TextField>
      <TextField
        select
        label="Estado"
        name="status"
        size="small"
        fullWidth
        value={filters.status}
        onChange={onChange}
      >
        <MenuItem value="all">Todos</MenuItem>
        <MenuItem value="pendiente">Pendiente</MenuItem>
        <MenuItem value="atendido">Atendido</MenuItem>
        <MenuItem value="cancelado">Cancelado</MenuItem>
        <MenuItem value="en_curso">En curso</MenuItem>
        <MenuItem value="completado">Completado</MenuItem>
      </TextField>
      <TextField
        select
        label="Saldo"
        name="balance"
        size="small"
        fullWidth
        value={filters.balance}
        onChange={onChange}
      >
        <MenuItem value="all">Todos</MenuItem>
        <MenuItem value="pending">Con deuda</MenuItem>
        <MenuItem value="paid">Pagado</MenuItem>
      </TextField>
      <TextField
        label="Desde"
        type="date"
        name="dateFrom"
        size="small"
        fullWidth
        slotProps={DATE_FROM_SLOT}
        value={filters.dateFrom}
        onChange={onChange}
      />
      <TextField
        label="Hasta"
        type="date"
        name="dateTo"
        size="small"
        fullWidth
        slotProps={DATE_FROM_SLOT}
        value={filters.dateTo}
        onChange={onChange}
      />
    </>
  );
});

// ─────────────────────────────────────────────────────────────
// PaymentsPage
// ─────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { isMobile } = useBreakpoint();
  const { rows, total, loading, error, filters, setFilter, fetchPayments } =
    usePaymentsPageStore();

  const [selected,     setSelected]     = useState(null);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(20);
  const [localFilters, setLocalFilters] = useState({ ...filters });

  // ── Fetch central ─────────────────────────────────────────
  const load = useCallback(() => {
    fetchPayments({ page, pageSize });
  }, [page, pageSize, filters, fetchPayments]);

  useEffect(() => { load(); }, [load]);

  // Reset página cuando cambian los filtros globales
  useEffect(() => { setPage(1); }, [filters]);

  // ── KPIs derivados — memoizados para no reducir en cada render
  const kpis = useMemo(() => {
    const bruto     = rows.reduce((s, r) => s + Number(r.billed),    0);
    const cobrado   = rows.reduce((s, r) => s + Number(r.collected), 0);
    const pendiente = rows.reduce((s, r) => s + Number(r.balance),   0);
    const conDeuda  = rows.filter((r)    => Number(r.balance) > 0).length;
    return { bruto, cobrado, pendiente, conDeuda };
  }, [rows]);

  // ── Conteo de filtros activos ─────────────────────────────
  const activeFilterCount = useMemo(
    () =>
      [
        filters.status !== "all",
        filters.balance !== "all",
        !!filters.search,
        !!filters.dateFrom,
        !!filters.dateTo,
        filters.refType !== "all",
      ].filter(Boolean).length,
    [filters],
  );

  // ── Handlers memoizados ───────────────────────────────────

  // Handler genérico para filtros desktop — un handler por evento
  // en lugar de una closure inline por cada TextField
  const handleDesktopFilter = useCallback((e) => {
    const { name, value } = e.target;
    setFilter(name, value);
    setPage(1);
  }, [setFilter]);

  // Handler para filtros del drawer móvil (localFilters)
  const handleLocalFilter = useCallback((e) => {
    const { name, value } = e.target;
    setLocalFilters((p) => ({ ...p, [name]: value }));
  }, []);

  const handleOpenFilter = useCallback(() => {
    setLocalFilters({ ...filters });
    setFilterOpen(true);
  }, [filters]);

  const handleCloseFilter = useCallback(() => setFilterOpen(false), []);

  const applyFilters = useCallback(() => {
    Object.entries(localFilters).forEach(([k, v]) => setFilter(k, v));
    setFilterOpen(false);
  }, [localFilters, setFilter]);

  const clearFilters = useCallback(() => {
    setLocalFilters(FILTERS_EMPTY);
    Object.entries(FILTERS_EMPTY).forEach(([k, v]) => setFilter(k, v));
  }, [setFilter]);

  const handleDetail    = useCallback((row) => setSelected(row), []);
  const handleCloseDetail = useCallback(() => {
    setSelected(null);
    load();
  }, [load]);

  const handlePageChange     = useCallback((p)  => setPage(p),                     []);
  const handlePageSizeChange = useCallback((ps) => { setPageSize(ps); setPage(1); }, []);

  // ── Subtitle memoizado ────────────────────────────────────
  const subtitle = useMemo(
    () => total + " registro" + (total !== 1 ? "s" : ""),
    [total],
  );

  return (
    <Box>
      <PageHeader title="Pagos" subtitle={subtitle} />

      {/* KPIs */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Facturado"  value={fmtS(kpis.bruto)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Cobrado"    value={fmtS(kpis.cobrado)}   color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard
            label="Por cobrar"
            value={fmtS(kpis.pendiente)}
            color={kpis.pendiente > 0 ? "error.main" : "text.primary"}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Con deuda" value={kpis.conDeuda + " en esta página"} />
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtros desktop */}
      {!isMobile && (
        <Card variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Buscar paciente o DNI..."
                  name="search"
                  value={filters.search}
                  onChange={handleDesktopFilter}
                  slotProps={SEARCH_SLOT}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField
                  select
                  label="Tipo"
                  name="refType"
                  size="small"
                  fullWidth
                  value={filters.refType}
                  onChange={handleDesktopFilter}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="appointment">Cita única</MenuItem>
                  <MenuItem value="case">Multisesión</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField
                  select
                  label="Estado"
                  name="status"
                  size="small"
                  fullWidth
                  value={filters.status}
                  onChange={handleDesktopFilter}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="atendido">Atendido</MenuItem>
                  <MenuItem value="en_curso">En curso</MenuItem>
                  <MenuItem value="completado">Completado</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 1.5 }}>
                <TextField
                  select
                  label="Saldo"
                  name="balance"
                  size="small"
                  fullWidth
                  value={filters.balance}
                  onChange={handleDesktopFilter}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="pending">Con deuda</MenuItem>
                  <MenuItem value="paid">Pagado</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 1.75 }}>
                <TextField
                  label="Desde"
                  type="date"
                  name="dateFrom"
                  size="small"
                  fullWidth
                  slotProps={DATE_FROM_SLOT}
                  value={filters.dateFrom}
                  onChange={handleDesktopFilter}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 1.75 }}>
                <TextField
                  label="Hasta"
                  type="date"
                  name="dateTo"
                  size="small"
                  fullWidth
                  slotProps={DATE_FROM_SLOT}
                  value={filters.dateTo}
                  onChange={handleDesktopFilter}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <FilterButton onClick={handleOpenFilter} activeCount={activeFilterCount} />
        </Box>
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
                <Typography textAlign="center" sx={{ mt: 4, color: "text.secondary" }}>
                  No se encontraron registros
                </Typography>
              ) : (
                rows.map((r) => (
                  <PaymentCard key={r.ref_id} row={r} onDetail={handleDetail} />
                ))
              )}
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Tratamiento</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Pagado</TableCell>
                    <TableCell>Saldo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Detalle</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <PaymentRow key={r.ref_id} row={r} onDetail={handleDetail} />
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

      <FilterDrawer
        open={filterOpen}
        onClose={handleCloseFilter}
        onApply={applyFilters}
        onClear={clearFilters}
        activeCount={activeFilterCount}
      >
        <FilterFields filters={localFilters} onChange={handleLocalFilter} />
      </FilterDrawer>

      <PaymentDetailModal
        open={!!selected}
        row={selected}
        onClose={handleCloseDetail}
      />
    </Box>
  );
}