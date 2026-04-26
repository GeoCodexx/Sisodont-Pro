import { useEffect, useState, useCallback } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Grid,
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
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { usePaymentStore } from "../../stores/usePaymentStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import PaymentDetailModal from "./PaymentDetailModal";
import FilterDrawer from "../../components/FilterDrawer";
import FilterButton from "../../components/FilterButton";
import PageHeader from "../../components/PageHeader";
import TablePagination from "../../components/TablePagination";

const STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};
const BALANCE_COLOR = (b) => (Number(b) > 0 ? "error.main" : "success.main");

function fmt(iso) {
  return iso
    ? new Date(iso).toLocaleDateString("es-PE", { dateStyle: "short" })
    : "—";
}

function KpiCard({ label, value, color }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: "16px !important" }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="h6"
          fontWeight={500}
          color={color ?? "text.primary"}
          mt={0.5}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function PaymentCard({ row, onDetail }) {
  const balance = Number(row.balance);
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
          {row.treatment_name ?? "—"} · {row.doctor_name ?? "—"} ·{" "}
          {fmt(row.date)}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Total
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                S/ {Number(row.total).toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Pagado
              </Typography>
              <Typography variant="body2" color="success.main">
                S/ {Number(row.paid).toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Saldo
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                color={BALANCE_COLOR(balance)}
              >
                S/ {balance.toFixed(2)}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Ver pagos">
            <IconButton size="small" onClick={() => onDetail(row)}>
              <ReceiptIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  const { isMobile } = useBreakpoint();
  const { rows, total, loading, error, filters, setFilter, fetchPayments } =
    usePaymentStore();

  const [selected, setSelected] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const setLocal = (k) => (v) => setLocalFilters((p) => ({ ...p, [k]: v }));

  // Fetch central server-side
  const load = useCallback(() => {
    fetchPayments({ page, pageSize });
  }, [page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const applyFilters = () => {
    Object.entries(localFilters).forEach(([k, v]) => setFilter(k, v));
    setFilterOpen(false);
  };
  const clearFilters = () => {
    const empty = {
      status: "all",
      balance: "all",
      search: "",
      dateFrom: "",
      dateTo: "",
    };
    setLocalFilters(empty);
    Object.entries(empty).forEach(([k, v]) => setFilter(k, v));
  };

  const activeFilterCount = [
    filters.status !== "all",
    filters.balance !== "all",
    !!filters.search,
    !!filters.dateFrom,
    !!filters.dateTo,
  ].filter(Boolean).length;

  // KPIs calculados de la página visible (para KPIs globales usar una query separada si se requiere)
  const totalBruto = rows.reduce((s, r) => s + Number(r.total), 0);
  const totalCobrado = rows.reduce((s, r) => s + Number(r.paid), 0);
  const totalPendiente = rows.reduce((s, r) => s + Number(r.balance), 0);
  const conDeuda = rows.filter((r) => Number(r.balance) > 0).length;

  const filterFields = (f, set) => (
    <>
      <TextField
        label="Buscar paciente o DNI"
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
        label="Saldo"
        size="small"
        fullWidth
        value={f.balance}
        onChange={(e) => set("balance")(e.target.value)}
      >
        <MenuItem value="all">Todos</MenuItem>
        <MenuItem value="pending">Con deuda</MenuItem>
        <MenuItem value="paid">Pagado</MenuItem>
      </TextField>
      <TextField
        label="Desde"
        type="date"
        size="small"
        fullWidth
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        value={f.dateFrom}
        onChange={(e) => set("dateFrom")(e.target.value)}
      />
      <TextField
        label="Hasta"
        type="date"
        size="small"
        fullWidth
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        value={f.dateTo}
        onChange={(e) => set("dateTo")(e.target.value)}
      />
    </>
  );

  return (
    <Box>
      <PageHeader
        title="Pagos"
        subtitle={total + " registro" + (total !== 1 ? "s" : "")}
      />

      <Grid container spacing={1.5} mb={2.5}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Facturado" value={"S/ " + totalBruto.toFixed(2)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard
            label="Cobrado"
            value={"S/ " + totalCobrado.toFixed(2)}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard
            label="Por cobrar"
            value={"S/ " + totalPendiente.toFixed(2)}
            color={totalPendiente > 0 ? "error.main" : "text.primary"}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Con deuda" value={conDeuda + " en esta página"} />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtros desktop */}
      {!isMobile && (
        <Grid container spacing={1.5} mb={2}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar paciente o DNI..."
              value={filters.search}
              onChange={(e) => {
                setFilter("search", e.target.value);
                setPage(1);
              }}
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
              onChange={(e) => {
                setFilter("status", e.target.value);
                setPage(1);
              }}
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
              label="Saldo"
              size="small"
              fullWidth
              value={filters.balance}
              onChange={(e) => {
                setFilter("balance", e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Con deuda</MenuItem>
              <MenuItem value="paid">Pagado</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              label="Desde"
              type="date"
              size="small"
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              value={filters.dateFrom}
              onChange={(e) => {
                setFilter("dateFrom", e.target.value);
                setPage(1);
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              label="Hasta"
              type="date"
              size="small"
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              value={filters.dateTo}
              onChange={(e) => {
                setFilter("dateTo", e.target.value);
                setPage(1);
              }}
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
                  <PaymentCard
                    key={r.appointment_id}
                    row={r}
                    onDetail={setSelected}
                  />
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
                    <TableRow key={r.appointment_id} hover>
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
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {r.doctor_name ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{fmt(r.date)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          S/ {Number(r.total).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main">
                          S/ {Number(r.paid).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color={BALANCE_COLOR(r.balance)}
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
                      <TableCell align="right">
                        <Tooltip title="Ver pagos">
                          <IconButton
                            size="small"
                            onClick={() => setSelected(r)}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

      <PaymentDetailModal
        open={!!selected}
        row={selected}
        onClose={() => {
          setSelected(null);
          load();
        }}
      />
    </Box>
  );
}
