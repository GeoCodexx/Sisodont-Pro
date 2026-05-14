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
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { usePaymentStore } from "../../stores/usePaymentStore";
import { useCasePaymentStore } from "../../stores/useCasePaymentStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRole } from "../../hooks/useRole";
import { supabase } from "../../services/supabaseClient";

const METHODS = ["efectivo", "tarjeta", "transferencia", "yape", "plin"];
const METHOD_COLORS = {
  efectivo: "default",
  tarjeta: "success",
  transferencia: "info",
  yape: "primary",
  plin: "secondary",
};

const EMPTY = { amount: "", method: "efectivo", notes: "" };

const fmtDT = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
const fmtD = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-PE", { dateStyle: "medium" })
    : "—";
const fmtS = (n) => "S/ " + Number(n ?? 0).toFixed(2);

// ── Vista para CASO multisesión ───────────────────────────────
function CasePaymentView({ row, onRefresh }) {
  /*const { payments, saving, fetchByCase, registerPayment, deletePayment } =
    useCasePaymentStore();*/
  const {
    paymentsByCase,
    saving,
    fetchByCase,
    registerPayment,
    deletePayment,
  } = useCasePaymentStore();

  const payments = paymentsByCase[row.ref_id] ?? [];
  const { profile } = useAuthStore();
  const { can } = useRole();

  const [form, setForm] = useState(EMPTY);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [caseData, setCaseData] = useState(row); // se recarga desde la vista tras cada pago
  const [sessions, setSessions] = useState([]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const totalBilled = Number(caseData.total ?? 0);
  const totalPaid = Number(caseData.paid ?? 0);
  const totalBalance = Number(caseData.balance ?? 0);

  const reloadCase = async () => {
    // Recargar desde payments_summary para tener saldos actualizados de la BD
    const { data } = await supabase
      .from("payments_summary")
      .select("*")
      .eq("payment_type", "case")
      .eq("ref_id", row.ref_id)
      .single();
    if (data) setCaseData(data);
    onRefresh();
  };

  useEffect(() => {
    fetchByCase(row.ref_id);
    // Cargar sesiones
    supabase
      .from("appointments_full")
      .select("id, date, status, notes")
      .eq("case_id", row.ref_id)
      .order("date")
      .then(({ data }) => setSessions(data ?? []));
  }, [row.ref_id]);

  const handleRegister = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Monto inválido.", type: "error" });
      return;
    }
    if (totalBilled > 0 && amount > totalBalance + 0.01) {
      setFeedback({
        msg: `Supera el saldo (${fmtS(totalBalance)}).`,
        type: "error",
      });
      return;
    }
    const { error } = await registerPayment({
      caseId: row.ref_id,
      amount,
      method: form.method,
      notes: form.notes,
      createdBy: profile?.id,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setForm(EMPTY);
      reloadCase();
    }
  };

  const handleDelete = async (payId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await deletePayment(payId, row.ref_id);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago eliminado.", type: "success" });
      reloadCase();
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <FolderOpenIcon color="primary" fontSize="small" />
        <Typography
          variant="body2"
          sx={{ color: "primary.main", fontWeight: 500 }}
        >
          Caso multisesión
        </Typography>
        <Chip
          label={caseData.case_status ?? "en_curso"}
          size="small"
          color={caseData.case_status === "completado" ? "success" : "primary"}
          sx={{ textTransform: "capitalize" }}
        />
      </Box>

      {/* Saldos desde la BD */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {[
          ["Costo total pactado", fmtS(totalBilled), "text.primary"],
          ["Total pagado", fmtS(totalPaid), "success.main"],
          [
            "Saldo pendiente",
            fmtS(totalBalance),
            totalBalance > 0 ? "error.main" : "text.secondary",
          ],
        ].map(([label, value, color]) => (
          <Box
            key={label}
            sx={{
              bgcolor: "action.hover",
              borderRadius: 2,
              p: 1.5,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: color }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Sesiones */}
      {sessions.length > 0 && (
        <>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              display: "block",
              mb: 0.75,
            }}
          >
            SESIONES ({sessions.length})
          </Typography>
          <Box sx={{ mb: 2 }}>
            {sessions.map((s, i) => (
              <Box
                key={s.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 0.75,
                  borderBottom:
                    i < sessions.length - 1 ? "0.5px solid" : "none",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">
                  Sesión {i + 1} · {fmtDT(s.date)}
                </Typography>
                <Chip
                  label={s.status}
                  size="small"
                  color={
                    s.status === "atendido"
                      ? "success"
                      : s.status === "cancelado"
                        ? "error"
                        : "warning"
                  }
                  sx={{ textTransform: "capitalize" }}
                />
              </Box>
            ))}
          </Box>
        </>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Historial de pagos */}
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontWeight: 500,
          display: "block",
          mb: 0.75,
        }}
      >
        PAGOS REGISTRADOS
      </Typography>

      {feedback.msg && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 1.5 }}
          onClose={() => setFeedback({ msg: "", type: "success" })}
        >
          {feedback.msg}
        </Alert>
      )}

      {payments.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Sin pagos registrados.
        </Typography>
      ) : (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Por</TableCell>
              {can(["ADMIN"]) && <TableCell align="right" />}
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Typography variant="body2">{fmtDT(p.created_at)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    color="success.main"
                  >
                    {fmtS(p.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.method}
                    size="small"
                    variant="outlined"
                    color={METHOD_COLORS[p.method] ?? "default"}
                    sx={{ textTransform: "capitalize" }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {p.created_by_profile?.full_name ?? "—"}
                  </Typography>
                </TableCell>
                {can(["ADMIN"]) && (
                  <TableCell align="right">
                    <Tooltip title="Eliminar pago">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(p.id)}
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

      {/* Registrar pago */}
      {can(["ADMIN", "ASSISTANT"]) &&
        (totalBalance > 0 || totalBilled === 0) && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                display: "block",
                mb: 1,
              }}
            >
              {totalBilled > 0
                ? `REGISTRAR PAGO — Saldo: ${fmtS(totalBalance)}`
                : "REGISTRAR PAGO"}
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
                  htmlInput: { min: 0.01, step: "0.01" },
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
                disabled={saving || !form.amount}
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

      {totalBalance <= 0 && totalPaid > 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1 }}>
          Tratamiento completamente pagado.
        </Alert>
      )}
    </>
  );
}

// ── Vista para CITA individual ────────────────────────────────
function AppointmentPaymentView({ row, onRefresh }) {
  const { registerAppointmentPayment, saving } = usePaymentStore();
  const { profile } = useAuthStore();
  const { can } = useRole();

  const [apptPayments, setApptPayments] = useState([]);
  const [rowData, setRowData] = useState(row);
  const [form, setForm] = useState(EMPTY);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const balance = Number(rowData.balance ?? 0);

  const reloadRow = async () => {
    const { data } = await supabase
      .from("payments_summary")
      .select("*")
      .eq("payment_type", "appointment")
      .eq("ref_id", row.ref_id)
      .single();
    if (data) setRowData(data);

    const { data: pays } = await supabase
      .from("payments")
      .select("*, created_by_profile:profiles(full_name)")
      .eq("appointment_id", row.ref_id)
      .order("created_at");
    setApptPayments(pays ?? []);
    onRefresh();
  };

  useEffect(() => {
    reloadRow();
  }, [row.ref_id]);

  const handleRegister = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Monto inválido.", type: "error" });
      return;
    }
    if (amount > balance + 0.01) {
      setFeedback({
        msg: `Supera el saldo (${fmtS(balance)}).`,
        type: "error",
      });
      return;
    }
    const { error } = await registerAppointmentPayment({
      appointmentId: row.ref_id,
      amount,
      method: form.method,
      notes: form.notes,
      createdBy: profile?.id,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setForm(EMPTY);
      reloadRow();
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <ReceiptIcon fontSize="small" color="action" />
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontWeight: 500 }}
        >
          Cita individual
        </Typography>
        <Chip
          label={rowData.status}
          size="small"
          color={
            rowData.status === "atendido"
              ? "success"
              : rowData.status === "cancelado"
                ? "error"
                : "warning"
          }
          sx={{ textTransform: "capitalize" }}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {[
          ["Total", fmtS(rowData.total), "text.primary"],
          ["Pagado", fmtS(rowData.paid), "success.main"],
          [
            "Saldo",
            fmtS(balance),
            balance > 0 ? "error.main" : "text.secondary",
          ],
        ].map(([label, value, color]) => (
          <Box
            key={label}
            sx={{
              bgcolor: "action.hover",
              borderRadius: 2,
              p: 1.5,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: color }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      {feedback.msg && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 1.5 }}
          onClose={() => setFeedback({ msg: "", type: "success" })}
        >
          {feedback.msg}
        </Alert>
      )}

      <Divider sx={{ mb: 1.5 }} />
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontWeight: 500,
          display: "block",
          mb: 0.75,
        }}
      >
        PAGOS REGISTRADOS
      </Typography>

      {apptPayments.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Sin pagos registrados.
        </Typography>
      ) : (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Por</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apptPayments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Typography variant="body2">{fmtDT(p.created_at)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{ color: "success.main" }}
                  >
                    {fmtS(p.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.method}
                    size="small"
                    variant="outlined"
                    color={METHOD_COLORS[p.method] ?? "default"}
                    sx={{ textTransform: "capitalize" }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {p.created_by_profile?.full_name ?? "—"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {can(["ADMIN", "ASSISTANT"]) && balance > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              display: "block",
              mb: 1,
            }}
          >
            REGISTRAR PAGO — Saldo: {fmtS(balance)}
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
                htmlInput: { min: 0.01, step: "0.01" },
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
              disabled={saving || !form.amount}
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
          Cita completamente pagada.
        </Alert>
      )}
    </>
  );
}

// ── Modal principal ───────────────────────────────────────────
export default function PaymentDetailModal({ open, row, onClose }) {
  const { fetchPayments } = usePaymentStore();
  if (!row) return null;
  const isCase = row.payment_type === "case";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 500 }}>
          {row.patient_name}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {row.treatment_name ?? "—"} · {fmtD(row.date)}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {isCase ? (
          <CasePaymentView row={row} onRefresh={fetchPayments} />
        ) : (
          <AppointmentPaymentView row={row} onRefresh={fetchPayments} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
