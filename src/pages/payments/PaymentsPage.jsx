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
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { usePaymentsPageStore } from "../../stores/usePaymentsPageStore";
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
  en_curso: "primary",
  completado: "success",
  abandonado: "default",
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
}

// Chip de tipo de pago
function TypeChip({ type }) {
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
}

// Tarjeta de pago para móvil
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
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 1, color: "text.secondary" }}
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
                sx={{ display: "block", color: "text.secondary" }}
              >
                {row.ref_type === "case" ? "Costo total" : "Total"}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                S/ {Number(row.billed).toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary" }}
              >
                Pagado
              </Typography>
              <Typography variant="body2" sx={{ color: "success.main" }}>
                S/ {Number(row.collected).toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary" }}
              >
                Saldo
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ color: BALANCE_COLOR(balance) }}
              >
                S/ {balance.toFixed(2)}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Ver detalle de pagos">
            <IconButton size="small" onClick={() => onDetail(row)}>
              {row.ref_type === "case" ? (
                <FolderOpenIcon fontSize="small" />
              ) : (
                <ReceiptIcon fontSize="small" />
              )}
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
    usePaymentsPageStore();

  const [selected, setSelected] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const setLocal = (k) => (v) => setLocalFilters((p) => ({ ...p, [k]: v }));

  const load = useCallback(() => {
    fetchPayments({ page, pageSize });
  }, [page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);
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
      refType: "all",
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
    filters.refType !== "all",
  ].filter(Boolean).length;

  const totalBruto = rows.reduce((s, r) => s + Number(r.billed), 0);
  const totalCobrado = rows.reduce((s, r) => s + Number(r.collected), 0);
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
        label="Tipo"
        size="small"
        fullWidth
        value={f.refType}
        onChange={(e) => set("paymentType")(e.target.value)}
      >
        <MenuItem value="all">Todos</MenuItem>
        <MenuItem value="appointment">Cita única</MenuItem>
        <MenuItem value="case">Multisesión</MenuItem>
      </TextField>
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
        <MenuItem value="en_curso">En curso</MenuItem>
        <MenuItem value="completado">Completado</MenuItem>
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

      {/* KPIs */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
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
        <Card variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 3 }}>
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
                  label="Tipo"
                  size="small"
                  fullWidth
                  value={filters.refType}
                  onChange={(e) => {
                    setFilter("refType", e.target.value);
                    setPage(1);
                  }}
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
                  <MenuItem value="en_curso">En curso</MenuItem>
                  <MenuItem value="completado">Completado</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 1.5 }}>
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
              <Grid size={{ xs: 6, sm: 1.75 }}>
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
              <Grid size={{ xs: 6, sm: 1.75 }}>
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
          </CardContent>
        </Card>
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
                  textAlign="center"
                  sx={{ mt: 4, color: "text.secondary" }}
                >
                  No se encontraron registros
                </Typography>
              ) : (
                rows.map((r) => (
                  <PaymentCard key={r.ref_id} row={r} onDetail={setSelected} />
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
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        align="center"
                        sx={{ py: 4, color: "text.secondary" }}
                      >
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((r) => (
                    <TableRow
                      key={r.ref_id}
                      hover
                      sx={{
                        bgcolor:
                          r.payment_type === "case"
                            ? "primary.main" + "08"
                            : "inherit",
                      }}
                    >
                      <TableCell>
                        <TypeChip type={r.ref_type} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {r.patient_name}
                        </Typography>
                        {r.patient_dni && (
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
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
                          S/ {Number(r.billed).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "success.main" }}
                        >
                          S/ {Number(r.collected).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ color: BALANCE_COLOR(r.balance) }}
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
                        <Tooltip
                          title={
                            r.payment_type === "case"
                              ? "Ver pagos del caso"
                              : "Ver pagos de la cita"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => setSelected(r)}
                          >
                            {r.payment_type === "case" ? (
                              <FolderOpenIcon
                                fontSize="small"
                                color="primary"
                              />
                            ) : (
                              <ReceiptIcon fontSize="small" />
                            )}
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
