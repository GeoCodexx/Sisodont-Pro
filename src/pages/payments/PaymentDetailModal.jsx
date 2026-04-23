import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { usePaymentStore } from "../../stores/usePaymentStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRole } from "../../hooks/useRole";

const METHODS = ["efectivo", "tarjeta", "transferencia", "yape", "plin"];
const METHOD_COLORS = {
  efectivo: "default",
  tarjeta: "primary",
  transferencia: "info",
  yape: "secondary",
  plin: "success",
};

const EMPTY_PAY = { amount: "", method: "efectivo", notes: "" };

export default function PaymentDetailModal({ open, row, onClose }) {
  const { detail, saving, fetchPaymentDetail, registerPayment, deletePayment } =
    usePaymentStore();
  const { profile } = useAuthStore();
  const { can } = useRole();

  const [form, setForm] = useState(EMPTY_PAY);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  useEffect(() => {
    if (open && row?.appointment_id) {
      fetchPaymentDetail(row.appointment_id);
      setForm(EMPTY_PAY);
      setFeedback({ msg: "", type: "success" });
    }
  }, [open, row?.appointment_id]);

  if (!row) return null;

  const balance = Number(row.balance);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleRegister = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
      return;
    }
    if (amount > balance + 0.001) {
      setFeedback({
        msg: `El monto supera el saldo (S/ ${balance.toFixed(2)}).`,
        type: "error",
      });
      return;
    }
    const { error } = await registerPayment({
      appointmentId: row.appointment_id,
      amount,
      method: form.method,
      notes: form.notes,
      createdBy: profile?.id,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setForm(EMPTY_PAY);
      fetchPaymentDetail(row.appointment_id);
    }
  };

  const handleDelete = async (payId, amount) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await deletePayment(payId, row.appointment_id, amount);
    if (error) setFeedback({ msg: error, type: "error" });
    else setFeedback({ msg: "Pago eliminado.", type: "success" });
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleString("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pagos — {row.patient_name}</DialogTitle>

      <DialogContent dividers>
        {/* Resumen de la cita */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Tratamiento
            </Typography>
            <Typography variant="body2">{row.treatment_name ?? "—"}</Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Doctor
            </Typography>
            <Typography variant="body2">{row.doctor_name ?? "—"}</Typography>
          </Box>
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
            <Typography variant="body2" color="success.main" fontWeight={500}>
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
              color={balance > 0 ? "error.main" : "text.secondary"}
            >
              S/ {balance.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {feedback.msg && (
          <Alert
            severity={feedback.type}
            sx={{ mb: 2 }}
            onClose={() => setFeedback({ msg: "", type: "success" })}
          >
            {feedback.msg}
          </Alert>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Historial de transacciones */}
        <Typography variant="subtitle2" fontWeight={500} mb={1.5}>
          Historial de transacciones
        </Typography>

        {detail.length === 0 ? (
          <Typography variant="body2" color="text.secondary" mb={2}>
            No hay pagos registrados para esta cita.
          </Typography>
        ) : (
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Registrado por</TableCell>
                {can(["ADMIN"]) && <TableCell align="right">Acción</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Typography variant="body2">{fmt(p.created_at)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      color="success.main"
                    >
                      S/ {Number(p.amount).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.method}
                      size="small"
                      color={METHOD_COLORS[p.method] ?? "default"}
                      variant="outlined"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {p.created_by_profile?.full_name ?? "—"}
                    </Typography>
                  </TableCell>
                  {can(["ADMIN"]) && (
                    <TableCell align="right">
                      <Tooltip title="Eliminar pago">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(p.id, Number(p.amount))}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Registrar nuevo pago */}
        {can(["ADMIN", "ASSISTANT"]) && balance > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={500} mb={1.5}>
              Registrar pago — Saldo: S/ {balance.toFixed(2)}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <TextField
                label="Monto"
                type="number"
                value={form.amount}
                onChange={set("amount")}
                size="small"
                sx={{ width: 130 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">S/</InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                select
                label="Método"
                value={form.method}
                onChange={set("method")}
                size="small"
                sx={{ width: 150 }}
              >
                {METHODS.map((m) => (
                  <MenuItem
                    key={m}
                    value={m}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {m}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Notas"
                value={form.notes}
                onChange={set("notes")}
                size="small"
                sx={{ flex: 1, minWidth: 120 }}
              />
              <Button
                variant="contained"
                onClick={handleRegister}
                disabled={saving}
                sx={{ alignSelf: "center" }}
              >
                {saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  "Registrar"
                )}
              </Button>
            </Box>
          </>
        )}

        {balance <= 0 && (
          <Alert severity="success" icon={false} sx={{ mt: 1 }}>
            Esta cita está completamente pagada.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
