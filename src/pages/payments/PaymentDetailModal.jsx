import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, MenuItem, InputAdornment, Alert,
  CircularProgress, Chip, IconButton, Tooltip,
} from "@mui/material";
import DeleteIcon     from "@mui/icons-material/Delete";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ReceiptIcon    from "@mui/icons-material/Receipt";
import { useLedgerStore } from "../../stores/useLedgerStore";
import { useRole }        from "../../hooks/useRole";
import { supabase }       from "../../services/supabaseClient";

// ─────────────────────────────────────────────────────────────
// Constantes fuera del componente
// ─────────────────────────────────────────────────────────────
const METHODS = ["efectivo", "tarjeta", "transferencia", "yape", "plin"];

const METHOD_COLORS = {
  efectivo:      "default",
  tarjeta:       "success",
  transferencia: "info",
  yape:          "primary",
  plin:          "secondary",
};

const EMPTY = { amount: "", method: "efectivo", notes: "" };

// Formatters — instancias únicas, no recrear por render
const dtFormatter   = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" });
const solesFormatter = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2 });

const fmtDT = (iso) => (iso ? dtFormatter.format(new Date(iso)) : "—");
const fmtS  = (n)   => `S/ ${solesFormatter.format(Number(n ?? 0))}`;

// slotProps estables
const AMOUNT_SLOT = {
  htmlInput: { min: 0.01, step: "0.01" },
  input:     { startAdornment: <InputAdornment position="start">S/</InputAdornment> },
};

// ─────────────────────────────────────────────────────────────
// Helper: recargar fila desde financial_summary
// Función pura fuera del componente — no necesita ser recreada
// ─────────────────────────────────────────────────────────────
async function reloadFromSummary(refType, refId) {
  const { data } = await supabase
    .from("financial_summary")
    .select("billed, collected, balance, status, case_status, ref_type")
    .eq("ref_type", refType)
    .eq("ref_id", refId)
    .single();
  return data ?? null;
}

// ─────────────────────────────────────────────────────────────
// FinancialSummaryGrid — resumen de 3 KPIs compartido entre
// CasePaymentView y AppointmentPaymentView
// ─────────────────────────────────────────────────────────────
const FinancialSummaryGrid = memo(function FinancialSummaryGrid({ rows }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, mb: 2 }}>
      {rows.map(([label, value, color]) => (
        <Box
          key={label}
          sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1.5, textAlign: "center" }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color }}>
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// PaymentTableRow — fila memoizada para la tabla de pagos
// Extraída del map inline para que memo sea efectivo
// ─────────────────────────────────────────────────────────────
const PaymentTableRow = memo(function PaymentTableRow({ p, onDelete, canAdmin }) {
  const amount    = useMemo(() => fmtS(p.amount),      [p.amount]);
  const createdAt = useMemo(() => fmtDT(p.created_at), [p.created_at]);
  const handleDel = useCallback(() => onDelete(p.id),  [onDelete, p.id]);

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2">{createdAt}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={500} color="success.main">
          {amount}
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
      {canAdmin && (
        <TableCell align="right">
          <Tooltip title="Eliminar pago">
            <IconButton size="small" onClick={handleDel}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );
});

// ─────────────────────────────────────────────────────────────
// PaymentForm — formulario de registro de pago compartido.
// Memoizado + handler unificado para evitar recrear closures
// por cada campo en cada render.
// ─────────────────────────────────────────────────────────────
const PaymentForm = memo(function PaymentForm({
  form, onChange, onRegister, saving, balanceLabel,
}) {
  return (
    <>
      <Divider sx={{ mb: 1.5 }} />
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", fontWeight: 500, display: "block", mb: 1 }}
      >
        {balanceLabel}
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField
          label="Monto"
          type="number"
          name="amount"
          value={form.amount}
          onChange={onChange}
          size="small"
          sx={{ width: 130 }}
          slotProps={AMOUNT_SLOT}
        />
        <TextField
          select
          label="Método"
          name="method"
          value={form.method}
          onChange={onChange}
          size="small"
          sx={{ width: 150 }}
        >
          {METHODS.map((m) => (
            <MenuItem key={m} value={m} sx={{ textTransform: "capitalize" }}>
              {m}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Notas"
          name="notes"
          value={form.notes}
          onChange={onChange}
          size="small"
          sx={{ flex: 1, minWidth: 120 }}
        />
        <Button
          variant="contained"
          onClick={onRegister}
          disabled={saving || !form.amount}
          sx={{ alignSelf: "center" }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : "Registrar"}
        </Button>
      </Box>
    </>
  );
});

// ─────────────────────────────────────────────────────────────
// SessionRow — fila de sesión memoizada
// ─────────────────────────────────────────────────────────────
const SESSION_STATUS_COLOR = { atendido: "success", cancelado: "error" };

const SessionRow = memo(function SessionRow({ s, index, isLast }) {
  const date = useMemo(() => fmtDT(s.date), [s.date]);
  const statusColor = SESSION_STATUS_COLOR[s.status] ?? "warning";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.75,
        borderBottom: isLast ? "none" : "0.5px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">
        Sesión {index + 1} · {date}
      </Typography>
      <Chip
        label={s.status}
        size="small"
        color={statusColor}
        sx={{ textTransform: "capitalize" }}
      />
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// CasePaymentView
// ─────────────────────────────────────────────────────────────
function CasePaymentView({ row }) {
  const { entriesByRef, saving, fetchByRef, register, remove } = useLedgerStore();
  const { can } = useRole();

  const payments = entriesByRef[row.ref_id] ?? [];
  const [form,     setForm]     = useState(EMPTY);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [rowData,  setRowData]  = useState(row);
  const [sessions, setSessions] = useState([]);

  const totalBilled  = Number(rowData.billed   ?? 0);
  const totalPaid    = Number(rowData.collected ?? 0);
  const totalBalance = Number(rowData.balance   ?? 0);

  const canAdmin = useMemo(() => can(["ADMIN"]),            [can]);
  const canPay   = useMemo(() => can(["ADMIN", "ASSISTANT"]), [can]);

  useEffect(() => {
    fetchByRef("case", row.ref_id);
    supabase
      .from("appointments_full")
      .select("id, date, status, notes")
      .eq("case_id", row.ref_id)
      .order("date")
      .then(({ data }) => setSessions(data ?? []));
  }, [row.ref_id, fetchByRef]);

  const reloadCase = useCallback(async () => {
    const data = await reloadFromSummary("case", row.ref_id);
    if (data) setRowData((prev) => ({ ...prev, ...data }));
    await fetchByRef("case", row.ref_id);
  }, [row.ref_id, fetchByRef]);

  const clearFeedback = useCallback(
    () => setFeedback({ msg: "", type: "success" }), [],
  );

  // Handler unificado — evita la factory `set(f)` que recrea closures
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleRegister = useCallback(async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Monto inválido.", type: "error" }); return;
    }
    if (totalBilled > 0 && amount > totalBalance + 0.01) {
      setFeedback({ msg: `Supera el saldo (${fmtS(totalBalance)}).`, type: "error" }); return;
    }
    const { error } = await register({
      refType: "case", refId: row.ref_id,
      amount, method: form.method, notes: form.notes,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setForm(EMPTY);
      reloadCase();
    }
  }, [form, totalBilled, totalBalance, row.ref_id, register, reloadCase]);

  const handleDelete = useCallback(async (entryId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await remove(entryId, row.ref_id);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago eliminado.", type: "success" });
      reloadCase();
    }
  }, [row.ref_id, remove, reloadCase]);

  // summaryRows memoizado para que FinancialSummaryGrid no re-renderice
  // cuando el componente padre re-renderiza por feedback o form
  const summaryRows = useMemo(() => [
    ["Costo total",  fmtS(totalBilled),  "text.primary"],
    ["Total pagado", fmtS(totalPaid),    "success.main"],
    ["Saldo",        fmtS(totalBalance), totalBalance > 0 ? "error.main" : "text.secondary"],
  ], [totalBilled, totalPaid, totalBalance]);

  const balanceLabel = useMemo(
    () => totalBilled > 0 ? `REGISTRAR PAGO — Saldo: ${fmtS(totalBalance)}` : "REGISTRAR PAGO",
    [totalBilled, totalBalance],
  );

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <FolderOpenIcon color="primary" fontSize="small" />
        <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 500 }}>
          Caso multisesión
        </Typography>
        <Chip
          label={rowData.case_status ?? "en_curso"}
          size="small"
          color={rowData.case_status === "completado" ? "success" : "primary"}
          sx={{ textTransform: "capitalize" }}
        />
      </Box>

      <FinancialSummaryGrid rows={summaryRows} />

      {sessions.length > 0 && (
        <>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 500, display: "block", mb: 0.75 }}
          >
            SESIONES ({sessions.length})
          </Typography>
          <Box sx={{ mb: 2 }}>
            {sessions.map((s, i) => (
              <SessionRow
                key={s.id}
                s={s}
                index={i}
                isLast={i === sessions.length - 1}
              />
            ))}
          </Box>
        </>
      )}

      <Divider sx={{ mb: 2 }} />
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", fontWeight: 500, display: "block", mb: 0.75 }}
      >
        PAGOS REGISTRADOS
      </Typography>

      {feedback.msg && (
        <Alert severity={feedback.type} sx={{ mb: 1.5 }} onClose={clearFeedback}>
          {feedback.msg}
        </Alert>
      )}

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
              {canAdmin && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <PaymentTableRow
                key={p.id}
                p={p}
                onDelete={handleDelete}
                canAdmin={canAdmin}
              />
            ))}
          </TableBody>
        </Table>
      )}

      {canPay && (totalBalance > 0 || totalBilled === 0) && (
        <PaymentForm
          form={form}
          onChange={handleFormChange}
          onRegister={handleRegister}
          saving={saving}
          balanceLabel={balanceLabel}
        />
      )}

      {totalBalance <= 0 && totalPaid > 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1 }}>
          Tratamiento completamente pagado.
        </Alert>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// AppointmentPaymentView
// ─────────────────────────────────────────────────────────────
function AppointmentPaymentView({ row }) {
  const { entriesByRef, saving, fetchByRef, register, remove } = useLedgerStore();
  const { can } = useRole();

  const payments = entriesByRef[row.ref_id] ?? [];
  const [form,     setForm]     = useState(EMPTY);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [rowData,  setRowData]  = useState(row);

  const balance = Number(rowData.balance ?? 0);

  const canAdmin = useMemo(() => can(["ADMIN"]),             [can]);
  const canPay   = useMemo(() => can(["ADMIN", "ASSISTANT"]), [can]);

  useEffect(() => {
    fetchByRef("appointment", row.ref_id);
  }, [row.ref_id, fetchByRef]);

  const reloadRow = useCallback(async () => {
    const data = await reloadFromSummary("appointment", row.ref_id);
    if (data) setRowData((prev) => ({ ...prev, ...data }));
    await fetchByRef("appointment", row.ref_id);
  }, [row.ref_id, fetchByRef]);

  const clearFeedback = useCallback(
    () => setFeedback({ msg: "", type: "success" }), [],
  );

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleRegister = useCallback(async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Monto inválido.", type: "error" }); return;
    }
    if (amount > balance + 0.01) {
      setFeedback({ msg: `Supera el saldo (${fmtS(balance)}).`, type: "error" }); return;
    }
    const { error } = await register({
      refType: "appointment", refId: row.ref_id,
      amount, method: form.method, notes: form.notes,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setForm(EMPTY);
      reloadRow();
    }
  }, [form, balance, row.ref_id, register, reloadRow]);

  const handleDelete = useCallback(async (entryId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await remove(entryId, row.ref_id);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago eliminado.", type: "success" });
      reloadRow();
    }
  }, [row.ref_id, remove, reloadRow]);

  const summaryRows = useMemo(() => [
    ["Total",  fmtS(rowData.billed),    "text.primary"],
    ["Pagado", fmtS(rowData.collected), "success.main"],
    ["Saldo",  fmtS(balance),           balance > 0 ? "error.main" : "text.secondary"],
  ], [rowData.billed, rowData.collected, balance]);

  const apptStatusColor =
    rowData.status === "atendido" ? "success"
    : rowData.status === "cancelado" ? "error"
    : "warning";

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <ReceiptIcon fontSize="small" color="action" />
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
          Cita individual
        </Typography>
        <Chip
          label={rowData.status}
          size="small"
          color={apptStatusColor}
          sx={{ textTransform: "capitalize" }}
        />
      </Box>

      <FinancialSummaryGrid rows={summaryRows} />

      {feedback.msg && (
        <Alert severity={feedback.type} sx={{ mb: 1.5 }} onClose={clearFeedback}>
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
              {canAdmin && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <PaymentTableRow
                key={p.id}
                p={p}
                onDelete={handleDelete}
                canAdmin={canAdmin}
              />
            ))}
          </TableBody>
        </Table>
      )}

      {canPay && balance > 0 && (
        <PaymentForm
          form={form}
          onChange={handleFormChange}
          onRegister={handleRegister}
          saving={saving}
          balanceLabel={`REGISTRAR PAGO — Saldo: ${fmtS(balance)}`}
        />
      )}

      {balance <= 0 && Number(rowData.collected ?? 0) > 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1 }}>
          Cita completamente pagada.
        </Alert>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PaymentDetailModal — modal principal
// ─────────────────────────────────────────────────────────────
export default function PaymentDetailModal({ open, row, onClose }) {
  if (!row) return null;
  const isCase = row.ref_type === "case";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
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
        {isCase
          ? <CasePaymentView row={row} />
          : <AppointmentPaymentView row={row} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}