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
import { useLedgerStore } from "../../stores/useLedgerStore";
import { useRole } from "../../hooks/useRole";
import { supabase } from "../../services/supabaseClient";

// ─────────────────────────────────────────────────────────────
// PaymentDetailModal — refactorizado
//
// Cambios:
// 1. usePaymentStore + useCasePaymentStore → useLedgerStore
// 2. reloadRow/reloadCase → financial_summary (no payments_summary)
// 3. register/remove de ledger_entries (no payments/case_payments)
// 4. Columnas: billed/collected/balance (no total/paid/balance)
// ─────────────────────────────────────────────────────────────

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
const fmtS = (n) => "S/ " + Number(n ?? 0).toFixed(2);

// ── Helper: recargar fila desde financial_summary ─────────────
async function reloadFromSummary(refType, refId) {
  const { data } = await supabase
    .from("financial_summary")
    .select("billed, collected, balance, status, case_status, ref_type")
    .eq("ref_type", refType)
    .eq("ref_id", refId)
    .single();
  return data ?? null;
}

// ── CasePaymentView ───────────────────────────────────────────
function CasePaymentView({ row }) {
  const { entriesByRef, saving, fetchByRef, register, remove } =
    useLedgerStore();
  const { can } = useRole();

  const payments = entriesByRef[row.ref_id] ?? [];
  const [form, setForm] = useState(EMPTY);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [rowData, setRowData] = useState(row);
  const [sessions, setSessions] = useState([]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // financial_summary usa billed/collected/balance
  const totalBilled = Number(rowData.billed ?? 0);
  const totalPaid = Number(rowData.collected ?? 0);
  const totalBalance = Number(rowData.balance ?? 0);

  const reloadCase = async () => {
    const data = await reloadFromSummary("case", row.ref_id);
    if (data) setRowData({ ...rowData, ...data });
    await fetchByRef("case", row.ref_id);
  };

  useEffect(() => {
    fetchByRef("case", row.ref_id);
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
    const { error } = await register({
      refType: "case",
      refId: row.ref_id,
      amount,
      method: form.method,
      notes: form.notes,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setForm(EMPTY);
      reloadCase();
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await remove(entryId, row.ref_id);
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
          label={rowData.case_status ?? "en_curso"}
          size="small"
          color={rowData.case_status === "completado" ? "success" : "primary"}
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
          ["Costo total", fmtS(totalBilled), "text.primary"],
          ["Total pagado", fmtS(totalPaid), "success.main"],
          [
            "Saldo",
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
            <Typography variant="body2" sx={{ fontWeight: 600, color }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

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

      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sin pagos aún.
        </Typography>
      ) : (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Registrado por</TableCell>
              {can(["ADMIN"]) && <TableCell />}
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
                  <Typography variant="body2" color="text.secondary">
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

// ── AppointmentPaymentView ────────────────────────────────────
function AppointmentPaymentView({ row }) {
  const { entriesByRef, saving, fetchByRef, register, remove } =
    useLedgerStore();
  const { can } = useRole();

  const payments = entriesByRef[row.ref_id] ?? [];
  const [form, setForm] = useState(EMPTY);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [rowData, setRowData] = useState(row);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // financial_summary usa billed/collected/balance
  const balance = Number(rowData.balance ?? 0);

  const reloadRow = async () => {
    const data = await reloadFromSummary("appointment", row.ref_id);
    if (data) setRowData({ ...rowData, ...data });
    await fetchByRef("appointment", row.ref_id);
  };

  useEffect(() => {
    fetchByRef("appointment", row.ref_id);
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
    const { error } = await register({
      refType: "appointment",
      refId: row.ref_id,
      amount,
      method: form.method,
      notes: form.notes,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setForm(EMPTY);
      reloadRow();
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await remove(entryId, row.ref_id);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago eliminado.", type: "success" });
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
          ["Total", fmtS(rowData.billed), "text.primary"],
          ["Pagado", fmtS(rowData.collected), "success.main"],
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
            <Typography variant="body2" sx={{ fontWeight: 600, color }}>
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

      {payments.length > 0 && (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Registrado por</TableCell>
              {can(["ADMIN"]) && <TableCell />}
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
                  <Typography variant="body2" color="text.secondary">
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
      {balance <= 0 && Number(rowData.collected ?? 0) > 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1 }}>
          Cita completamente pagada.
        </Alert>
      )}
    </>
  );
}

// ── Modal principal ───────────────────────────────────────────
export default function PaymentDetailModal({ open, row, onClose }) {
  if (!row) return null;
  const isCase = row.ref_type === "case";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        {isCase ? "Detalle del caso multisesión" : "Detalle de pago"}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {row.patient_name ?? "—"}
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {row.treatment_name ?? "—"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Dr. {row.doctor_name ?? "—"}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {isCase ? (
          <CasePaymentView row={row} />
        ) : (
          <AppointmentPaymentView row={row} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
