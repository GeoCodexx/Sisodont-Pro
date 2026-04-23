import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { usePaymentStore } from "../../stores/usePaymentStore";
import PaymentDetailModal from "./PaymentDetailModal";

const STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};
const BALANCE_COLOR = (b) => (b > 0 ? "error.main" : "success.main");

function KpiCard({ label, value, sub, color }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: "16px !important" }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="h5"
          fontWeight={500}
          color={color ?? "text.primary"}
          mt={0.5}
        >
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  const { rows, loading, error, filters, setFilter, fetchPayments } =
    usePaymentStore();

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);
  useEffect(() => {
    fetchPayments();
  }, [filters]);

  // KPIs calculados del listado actual
  const totalBruto = rows.reduce((s, r) => s + Number(r.total), 0);
  const totalCobrado = rows.reduce((s, r) => s + Number(r.paid), 0);
  const totalPendiente = rows.reduce((s, r) => s + Number(r.balance), 0);
  const conDeuda = rows.filter((r) => Number(r.balance) > 0).length;

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("es-PE", { dateStyle: "short" })
      : "—";

  return (
    <Box>
      <Typography variant="h6" fontWeight={500} mb={3}>
        Pagos
      </Typography>

      {/* KPIs */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard
            label="Total facturado"
            value={`S/ ${totalBruto.toFixed(2)}`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard
            label="Total cobrado"
            value={`S/ ${totalCobrado.toFixed(2)}`}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard
            label="Por cobrar"
            value={`S/ ${totalPendiente.toFixed(2)}`}
            color={totalPendiente > 0 ? "error.main" : "text.primary"}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard
            label="Citas con deuda"
            value={conDeuda}
            sub="del período filtrado"
          />
        </Grid>
      </Grid>

      {/* Filtros */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            placeholder="Buscar paciente o DNI..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
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
            onChange={(e) => setFilter("status", e.target.value)}
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
            label="Saldo"
            value={filters.balance}
            onChange={(e) => setFilter("balance", e.target.value)}
            size="small"
            fullWidth
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
            value={filters.dateFrom}
            onChange={(e) => setFilter("dateFrom", e.target.value)}
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
            onChange={(e) => setFilter("dateTo", e.target.value)}
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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
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
                      color={BALANCE_COLOR(Number(r.balance))}
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
                      <IconButton size="small" onClick={() => setSelected(r)}>
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

      <PaymentDetailModal
        open={!!selected}
        row={selected}
        onClose={() => {
          setSelected(null);
          fetchPayments();
        }}
      />
    </Box>
  );
}
