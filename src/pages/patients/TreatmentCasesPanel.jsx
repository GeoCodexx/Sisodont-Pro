import { supabase } from "../../services/supabaseClient";
import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Button,
  Alert,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTreatmentCaseStore } from "../../stores/useTreatmentCaseStore";
import { useLedgerStore } from "../../stores/useLedgerStore";
import { useAuthStore } from "../../stores/useAuthStore";

// ─────────────────────────────────────────────────────────────
// Constantes fuera del componente
// ─────────────────────────────────────────────────────────────
// Íconos instanciados una sola vez — no recrear en cada render
const ICON_FOLDER_OPEN = <FolderOpenIcon fontSize="small" />;
const ICON_CHECK_CIRCLE = <CheckCircleIcon fontSize="small" />;
const ICON_FOLDER = <FolderIcon fontSize="small" />;

const STATUS_META = {
  en_curso: { label: "En curso", color: "primary", icon: ICON_FOLDER_OPEN },
  completado: {
    label: "Completado",
    color: "success",
    icon: ICON_CHECK_CIRCLE,
  },
  abandonado: { label: "Abandonado", color: "default", icon: ICON_FOLDER },
};

const APPT_STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};

const METHODS = ["efectivo", "tarjeta", "transferencia", "yape", "plin"];

const METHOD_COLORS = {
  efectivo: "default",
  tarjeta: "success",
  transferencia: "info",
  yape: "primary",
  plin: "secondary",
};

// ─────────────────────────────────────────────────────────────
// Formatters — instancias únicas, no recrear por render
// ─────────────────────────────────────────────────────────────
const dateFormatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "short" });
const dtFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});
const solesFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
});

const fmtDate = (iso) => (iso ? dateFormatter.format(new Date(iso)) : "—");
const fmtDT = (iso) => (iso ? dtFormatter.format(new Date(iso)) : "—");
const fmtS = (n) => `S/ ${solesFormatter.format(Number(n ?? 0))}`;

// slotProps estático para el campo de monto
const AMOUNT_SLOT = {
  htmlInput: { min: 0.01, step: "0.01" },
  input: {
    startAdornment: <InputAdornment position="start">S/</InputAdornment>,
  },
};

// ─────────────────────────────────────────────────────────────
// PaymentCard — ya tenía React.memo, se mantiene y se añaden
// callbacks estables internos
// ─────────────────────────────────────────────────────────────
const PaymentCard = React.memo(function PaymentCard({ p }) {
  // Valores derivados — se calculan una sola vez por render de esta card
  const amount = useMemo(() => fmtS(p.amount), [p.amount]);
  const createdAt = useMemo(() => fmtDT(p.created_at), [p.created_at]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ pb: "10px !important", pt: 1.5, px: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color:
                    p.direction === "egreso" ? "error.main" : "success.main",
                }}
              >
                {p.direction === "egreso" ? `−${amount}` : amount}
              </Typography>
              <Chip
                label={p.method}
                size="small"
                variant="outlined"
                color={METHOD_COLORS[p.method] ?? "default"}
                sx={{ textTransform: "capitalize", fontSize: 10, height: 18 }}
              />
              {p.direction === "egreso" && (
                <Chip
                  label="Devolución"
                  size="small"
                  color="error"
                  variant="filled"
                  sx={{ fontSize: 10, height: 18 }}
                />
              )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {createdAt} · {p.created_by_profile?.full_name ?? "—"}
            </Typography>
            {p.notes && (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  fontStyle: "italic",
                  color: "text.secondary",
                  display: "block",
                }}
              >
                {p.notes}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// PaymentTableRow — fila memoizada para la tabla de pagos
// Extraída del map inline para que React.memo sea efectivo
// ─────────────────────────────────────────────────────────────
const PaymentTableRow = memo(function PaymentTableRow({ p }) {
  const amount = useMemo(() => fmtS(p.amount), [p.amount]);
  const createdAt = useMemo(() => fmtDT(p.created_at), [p.created_at]);

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2">{createdAt}</Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: p.direction === "egreso" ? "error.main" : "success.main",
          }}
        >
          {p.direction === "egreso" ? `−${amount}` : amount}
        </Typography>
      </TableCell>
      <TableCell>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Chip
            label={p.method}
            size="small"
            variant="outlined"
            color={METHOD_COLORS[p.method] ?? "default"}
            sx={{ textTransform: "capitalize" }}
          />
          {p.direction === "egreso" && (
            <Chip
              label="Devolución"
              size="small"
              color="error"
              variant="filled"
              sx={{ fontSize: 10, height: 18 }}
            />
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Tooltip title={p.notes || ""} arrow>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              maxWidth: 180,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p.notes || "—"}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {p.created_by_profile?.full_name ?? "—"}
        </Typography>
      </TableCell>
    </TableRow>
  );
});

// ─────────────────────────────────────────────────────────────
// PaymentTable — React.memo ya existía, se refactoriza para
// usar PaymentTableRow memoizado
// ─────────────────────────────────────────────────────────────
const PaymentTable = React.memo(function PaymentTable({ payments }) {
  return (
    <Table size="small" sx={{ mb: 1.5 }}>
      <TableHead>
        <TableRow>
          <TableCell>Fecha</TableCell>
          <TableCell>Monto</TableCell>
          <TableCell>Método</TableCell>
          <TableCell>Notas</TableCell>
          <TableCell>Registrado por</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((p) => (
          <PaymentTableRow key={p.id} p={p} />
        ))}
      </TableBody>
    </Table>
  );
});

// ─────────────────────────────────────────────────────────────
// PaymentForm — memo + handlers estables
// ─────────────────────────────────────────────────────────────
const FORM_EMPTY = { amount: "", method: "efectivo", notes: "" };

const PaymentForm = memo(function PaymentForm({
  onRegister,
  saving,
  maxAmount,
  showLimit,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [form, setForm] = useState(FORM_EMPTY);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    onRegister(form);
    setForm(FORM_EMPTY);
  }, [form, onRegister]);

  const helperText = useMemo(
    () => (showLimit && maxAmount > 0 ? `Máx: ${fmtS(maxAmount)}` : ""),
    [showLimit, maxAmount],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
        flexWrap: "wrap",
      }}
    >
      <TextField
        label="Monto"
        type="number"
        name="amount"
        value={form.amount}
        onChange={handleChange}
        size="small"
        sx={{ width: { xs: "100%", sm: 130 } }}
        slotProps={AMOUNT_SLOT}
        helperText={helperText}
      />
      <TextField
        select
        label="Método"
        name="method"
        value={form.method}
        onChange={handleChange}
        size="small"
        sx={{ width: { xs: "100%", sm: 150 } }}
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
        onChange={handleChange}
        size="small"
        sx={{ flex: 1, minWidth: { xs: "100%", sm: 120 } }}
        placeholder="Opcional..."
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={saving || !form.amount}
        sx={{
          alignSelf: { xs: "stretch", sm: "flex-start" },
          mt: { xs: 0, sm: 0.5 },
        }}
      >
        {saving ? "Registrando..." : "Registrar pago"}
      </Button>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// FinancialSummary — sub-componente memoizado para el resumen
// de 3 valores (Costo / Pagado / Saldo). Se usa tanto en
// CasePaymentsSection como en AppointmentPaymentsSection.
// ─────────────────────────────────────────────────────────────
const FinancialSummary = memo(function FinancialSummary({ rows }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 1,
        mb: 2,
      }}
    >
      {rows.map(([label, value, color]) => (
        <Box
          key={label}
          sx={{
            bgcolor: "action.hover",
            borderRadius: 1.5,
            p: 1.25,
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
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
// CasePaymentsSection
// ─────────────────────────────────────────────────────────────
function CasePaymentsSection({ caseData }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { entriesByRef, saving, fetchByRef, register, registerRefund, remove } =
    useLedgerStore();
  // Selectores granulares — evitan re-suscripciones innecesarias
  const role = useAuthStore((s) => s.role);

  const payments = entriesByRef[caseData.id] ?? [];
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [refundForm, setRefundForm] = useState({
    open: false,
    amount: "",
    method: "efectivo",
    reason: "",
  });

  const resetRefundForm = useCallback(
    () =>
      setRefundForm({
        open: false,
        amount: "",
        method: "efectivo",
        reason: "",
      }),
    [],
  );

  const totalBilled = useMemo(
    () => Number(caseData.total_billed ?? 0),
    [caseData.total_billed],
  );
  const paymentsTotal = useMemo(
    () =>
      payments.reduce((acc, p) => {
        const signed =
          p.direction === "egreso"
            ? -Number(p.amount || 0)
            : Number(p.amount || 0);
        return acc + signed;
      }, 0),
    [payments],
  );
  const totalPaid = paymentsTotal;
  const totalBalance = totalBilled - paymentsTotal;

  const canPay = role === "ADMIN" || role === "ASSISTANT";

  useEffect(() => {
    fetchByRef("case", caseData.id);
  }, [caseData.id, fetchByRef]);

  const clearFeedback = useCallback(
    () => setFeedback({ msg: "", type: "success" }),
    [],
  );

  const handleRegister = useCallback(
    async (form) => {
      const amount = parseFloat(form.amount);
      if (!amount || amount <= 0) {
        setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
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
        refId: caseData.id,
        amount,
        method: form.method,
        notes: form.notes,
      });
      if (error) setFeedback({ msg: error, type: "error" });
      else setFeedback({ msg: "Pago registrado.", type: "success" });
    },
    [totalBilled, totalBalance, caseData.id, register],
  );

  const handleRefund = useCallback(async () => {
    const amount = parseFloat(refundForm.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
      return;
    }
    // totalPaid ya es el neto (ingresos - egresos previos)
    if (amount > totalPaid + 0.001) {
      setFeedback({
        msg: `No puedes reembolsar más de lo cobrado neto (${fmtS(totalPaid)}).`,
        type: "error",
      });
      return;
    }
    const { error } = await registerRefund({
      refType: "case",
      refId: caseData.id,
      amount,
      method: refundForm.method,
      refundReason:
        refundForm.reason || `Reembolso manual — caso ${caseData.id}`,
      currentNetPaid: totalPaid,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({
        msg: "Reembolso registrado correctamente.",
        type: "success",
      });
      resetRefundForm();
    }
  }, [refundForm, totalPaid, caseData.id, registerRefund, resetRefundForm]);

  const summaryRows = useMemo(
    () => [
      ["Costo total", fmtS(totalBilled), "text.primary"],
      ["Pagado", fmtS(totalPaid), "success.main"],
      [
        "Saldo",
        fmtS(totalBalance),
        totalBalance > 0 ? "error.main" : "text.secondary",
      ],
    ],
    [totalBilled, totalPaid, totalBalance],
  );

  return (
    <Box>
      <FinancialSummary rows={summaryRows} />

      {feedback.msg && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 1.5 }}
          onClose={clearFeedback}
        >
          {feedback.msg}
        </Alert>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={500}
        display="block"
        sx={{ mb: 0.75 }}
      >
        PAGOS REGISTRADOS
      </Typography>

      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sin pagos registrados aún.
        </Typography>
      ) : isMobile ? (
        <Box mb={1.5}>
          {payments.map((p) => (
            <PaymentCard key={p.id} p={p} />
          ))}
        </Box>
      ) : (
        <PaymentTable payments={payments} />
      )}

      {canPay && (totalBalance > 0 || totalBilled === 0) && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={500}
            display="block"
            sx={{ mb: 1 }}
          >
            {totalBilled > 0
              ? `NUEVO PAGO — Saldo: ${fmtS(totalBalance)}`
              : "REGISTRAR PAGO"}
          </Typography>
          <PaymentForm
            onRegister={handleRegister}
            saving={saving}
            maxAmount={totalBalance}
            showLimit={totalBilled > 0}
          />
          {/* Reembolso manual — solo si hay algo cobrado y el rol lo permite */}
          {canPay && totalPaid > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              {!refundForm.open ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => setRefundForm((f) => ({ ...f, open: true }))}
                >
                  Registrar reembolso
                </Button>
              ) : (
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "warning.light",
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="warning.dark"
                    fontWeight={500}
                    display="block"
                    sx={{ mb: 1 }}
                  >
                    REEMBOLSO — máx. {fmtS(totalPaid)}
                  </Typography>

                  <Grid container spacing={1.5} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Monto a reembolsar"
                        type="number"
                        value={refundForm.amount}
                        onChange={(e) =>
                          setRefundForm((f) => ({
                            ...f,
                            amount: e.target.value,
                          }))
                        }
                        slotProps={{
                          htmlInput: {
                            min: 0.01,
                            max: totalPaid,
                            step: "0.01",
                          },
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                S/
                              </InputAdornment>
                            ),
                          },
                        }}
                        helperText={`Máximo: ${fmtS(totalPaid)}`}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="Canal de devolución"
                        value={refundForm.method}
                        onChange={(e) =>
                          setRefundForm((f) => ({
                            ...f,
                            method: e.target.value,
                          }))
                        }
                      >
                        {[
                          "efectivo",
                          "yape",
                          "plin",
                          "transferencia",
                          "tarjeta",
                        ].map((m) => (
                          <MenuItem
                            key={m}
                            value={m}
                            sx={{ textTransform: "capitalize" }}
                          >
                            {m}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        label="Motivo del reembolso"
                        value={refundForm.reason}
                        onChange={(e) =>
                          setRefundForm((f) => ({
                            ...f,
                            reason: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          onClick={handleRefund}
                          disabled={saving}
                          startIcon={
                            saving ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : null
                          }
                        >
                          {saving ? "Procesando..." : "Confirmar reembolso"}
                        </Button>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={resetRefundForm}
                          disabled={saving}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </>
          )}
        </>
      )}

      {totalBalance <= 0 && totalPaid > 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1.5 }}>
          Tratamiento completamente pagado.
        </Alert>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// AppointmentPaymentsSection
// ─────────────────────────────────────────────────────────────
function AppointmentPaymentsSection({ appt }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { entriesByRef, saving, fetchByRef, register, registerRefund, remove } =
    useLedgerStore();
  const role = useAuthStore((s) => s.role);

  const payments = entriesByRef[appt.id] ?? [];
  const paymentsTotal = useMemo(
    () =>
      payments.reduce((acc, p) => {
        const signed =
          p.direction === "egreso"
            ? -Number(p.amount || 0)
            : Number(p.amount || 0);
        return acc + signed;
      }, 0),
    [payments],
  );
  const totalPaid = paymentsTotal;
  const balance = Number(appt.total ?? 0) - totalPaid;

  const canPay = role === "ADMIN" || role === "ASSISTANT";

  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  const [refundForm, setRefundForm] = useState({
    open: false,
    amount: "",
    method: "efectivo",
    reason: "",
  });

  useEffect(() => {
    fetchByRef("appointment", appt.id);
  }, [appt.id, fetchByRef]);

  const resetRefundForm = useCallback(
    () =>
      setRefundForm({
        open: false,
        amount: "",
        method: "efectivo",
        reason: "",
      }),
    [],
  );

  const clearFeedback = useCallback(
    () => setFeedback({ msg: "", type: "success" }),
    [],
  );

  const handleRegister = useCallback(
    async (form) => {
      const amount = parseFloat(form.amount);
      if (!amount || amount <= 0) {
        setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
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
        refId: appt.id,
        amount,
        method: form.method,
        notes: form.notes,
      });
      if (error) setFeedback({ msg: error, type: "error" });
      else setFeedback({ msg: "Pago registrado.", type: "success" });
    },
    [balance, appt.id, register],
  );

  const handleRefund = useCallback(async () => {
    const amount = parseFloat(refundForm.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
      return;
    }
    // totalPaid ya es el neto (ingresos - egresos previos)
    if (amount > totalPaid + 0.001) {
      setFeedback({
        msg: `No puedes reembolsar más de lo cobrado neto (${fmtS(totalPaid)}).`,
        type: "error",
      });
      return;
    }
    const { error } = await registerRefund({
      refType: "appointment",
      refId: appt.id,
      amount,
      method: refundForm.method,
      refundReason:
        refundForm.reason || `Reembolso manual — cita ${appt.id}`,
      currentNetPaid: totalPaid,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({
        msg: "Reembolso registrado correctamente.",
        type: "success",
      });
      resetRefundForm();
    }
  }, [refundForm, totalPaid, appt.id, registerRefund, resetRefundForm]);

  const summaryRows = useMemo(
    () => [
      ["Total", fmtS(appt.total ?? 0), "text.primary"],
      ["Pagado", fmtS(totalPaid), "success.main"],
      ["Saldo", fmtS(balance), balance > 0 ? "error.main" : "text.secondary"],
    ],
    [appt.total, totalPaid, balance],
  );

  return (
    <Box>
      <FinancialSummary rows={summaryRows} />

      {feedback.msg && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 1.5 }}
          onClose={clearFeedback}
        >
          {feedback.msg}
        </Alert>
      )}

      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sin pagos registrados.
        </Typography>
      ) : isMobile ? (
        <Box mb={1.5}>
          {payments.map((p) => (
            <PaymentCard key={p.id} p={p} />
          ))}
        </Box>
      ) : (
        <PaymentTable payments={payments} />
      )}

      {canPay && balance > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={500}
            display="block"
            sx={{ mb: 1 }}
          >
            {`NUEVO PAGO — Saldo: ${fmtS(balance)}`}
          </Typography>
          <PaymentForm
            onRegister={handleRegister}
            saving={saving}
            maxAmount={balance}
            showLimit
          />
          {/* Reembolso manual — solo si hay algo cobrado y el rol lo permite */}
          {canPay && totalPaid > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              {!refundForm.open ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => setRefundForm((f) => ({ ...f, open: true }))}
                >
                  Registrar reembolso
                </Button>
              ) : (
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "warning.light",
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="warning.dark"
                    fontWeight={500}
                    display="block"
                    sx={{ mb: 1 }}
                  >
                    REEMBOLSO — máx. {fmtS(totalPaid)}
                  </Typography>

                  <Grid container spacing={1.5} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Monto a reembolsar"
                        type="number"
                        value={refundForm.amount}
                        onChange={(e) =>
                          setRefundForm((f) => ({
                            ...f,
                            amount: e.target.value,
                          }))
                        }
                        slotProps={{
                          htmlInput: {
                            min: 0.01,
                            max: totalPaid,
                            step: "0.01",
                          },
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                S/
                              </InputAdornment>
                            ),
                          },
                        }}
                        helperText={`Máximo: ${fmtS(totalPaid)}`}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="Canal de devolución"
                        value={refundForm.method}
                        onChange={(e) =>
                          setRefundForm((f) => ({
                            ...f,
                            method: e.target.value,
                          }))
                        }
                      >
                        {[
                          "efectivo",
                          "yape",
                          "plin",
                          "transferencia",
                          "tarjeta",
                        ].map((m) => (
                          <MenuItem
                            key={m}
                            value={m}
                            sx={{ textTransform: "capitalize" }}
                          >
                            {m}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        label="Motivo del reembolso"
                        value={refundForm.reason}
                        onChange={(e) =>
                          setRefundForm((f) => ({
                            ...f,
                            reason: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          onClick={handleRefund}
                          disabled={saving}
                          startIcon={
                            saving ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : null
                          }
                        >
                          {saving ? "Procesando..." : "Confirmar reembolso"}
                        </Button>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={resetRefundForm}
                          disabled={saving}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </>
          )}
        </>
      )}

      {balance <= 0 && totalPaid > 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1.5 }}>
          Cita completamente pagada.
        </Alert>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// CaseAccordion — caso multisesión memoizado
// Extraído del map inline de TreatmentCasesPanel para que
// memo pueda hacer bailout cuando el caso no cambió
// ─────────────────────────────────────────────────────────────
const CaseAccordion = memo(function CaseAccordion({
  c,
  expanded,
  onToggle,
  canManage,
  onStatusChange,
}) {
  const meta = STATUS_META[c.status] ?? STATUS_META.en_curso;
  const balance = Number(c.total_balance ?? 0);
  const paid = Number(c.total_paid ?? 0);
  const billed = Number(c.total_billed ?? 0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const startedAt = useMemo(() => fmtDate(c.started_at), [c.started_at]);

  const handleChange = useCallback(
    (_, open) => onToggle(open ? c.id : null),
    [c.id, onToggle],
  );

  const sessionInfo = useMemo(
    () => [
      ["Sesiones realizadas", c.sessions_attended ?? 0],
      ["Sesiones planificadas", c.total_sessions ?? "—"],
      ["Sesiones pendientes", c.sessions_pending ?? 0],
    ],
    [c.sessions_attended, c.total_sessions, c.sessions_pending],
  );

  return (
    <Accordion
      expanded={expanded}
      onChange={handleChange}
      variant="outlined"
      sx={{ mb: 1, "&:before": { display: "none" } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flex: 1,
            minWidth: 0,
            mr: 1,
          }}
        >
          {meta.icon}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {c.treatment_name ?? "—"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Dr. {c.doctor_name ?? "—"} · Inicio: {startedAt}
              {Number(c.sessions_attended) > 0 &&
                ` · ${c.sessions_attended} sesión(es)`}
            </Typography>
            {isMobile && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexShrink: 0,
                }}
              >
                {billed > 0 && balance > 0 && (
                  <Chip
                    label={`Debe ${fmtS(balance)}`}
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ fontSize: 10 }}
                  />
                )}
                {billed > 0 && balance <= 0 && paid > 0 && (
                  <Chip
                    label="Pagado"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: 10 }}
                  />
                )}
                <Chip label={meta.label} color={meta.color} size="small" />
              </Box>
            )}
          </Box>
          {isMobile || (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                flexShrink: 0,
              }}
            >
              {billed > 0 && balance > 0 && (
                <Chip
                  label={`Debe ${fmtS(balance)}`}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontSize: 10 }}
                />
              )}
              {billed > 0 && balance <= 0 && paid > 0 && (
                <Chip
                  label="Pagado"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: 10 }}
                />
              )}
              <Chip label={meta.label} color={meta.color} size="small" />
            </Box>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2, pt: 1, flexWrap: "wrap" }}>
          {sessionInfo.map(([label, value]) => (
            <Box key={label}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {value}
              </Typography>
            </Box>
          ))}
          {c.notes && (
            <Box sx={{ width: "100%" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Notas del caso
              </Typography>
              <Typography variant="body2">{c.notes}</Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={500}
          display="block"
          sx={{ mb: 1.5 }}
        >
          PAGOS DEL TRATAMIENTO
        </Typography>
        <CasePaymentsSection caseData={c} />
        <Divider sx={{ my: 2 }} />

        {canManage && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Estado:
            </Typography>
            {["en_curso", "completado", "abandonado"].map((s) => (
              <Button
                key={s}
                size="small"
                variant={c.status === s ? "contained" : "outlined"}
                color={STATUS_META[s].color}
                disabled={c.status === s}
                onClick={() => onStatusChange(c.id, s)}
                sx={{ textTransform: "capitalize", fontSize: 12 }}
              >
                {STATUS_META[s].label}
              </Button>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
});

// ─────────────────────────────────────────────────────────────
// IndividualTreatmentsSection
// ─────────────────────────────────────────────────────────────
const ApptAccordion = memo(function ApptAccordion({ a, expanded, onToggle }) {
  const statusColor = APPT_STATUS_COLOR[a.status] ?? "default";
  const date = useMemo(() => fmtDT(a.date), [a.date]);
  const handleChange = useCallback(
    (_, open) => onToggle(open ? a.id : null),
    [a.id, onToggle],
  );

  return (
    <Accordion
      expanded={expanded}
      onChange={handleChange}
      variant="outlined"
      sx={{ mb: 1, "&:before": { display: "none" } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flex: 1,
            minWidth: 0,
            mr: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {a.treatment_name ?? "—"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Dr. {a.doctor_name ?? "—"} · {date}
            </Typography>
          </Box>
          <Chip
            label={a.status}
            color={statusColor}
            size="small"
            sx={{ textTransform: "capitalize", flexShrink: 0 }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <AppointmentPaymentsSection appt={a} />
      </AccordionDetails>
    </Accordion>
  );
});

function IndividualTreatmentsSection({ patientId }) {
  const [expandedAppt, setExpandedAppt] = useState(null);
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("appointments_full")
      .select("*")
      .eq("patient_id", patientId)
      .is("case_id", null)
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setAppts(data ?? []);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const handleToggleAppt = useCallback((id) => setExpandedAppt(id), []);

  if (loading)
    return (
      <Box sx={{ py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );

  if (!appts.length)
    return (
      <Typography variant="body2" color="text.secondary">
        Sin citas individuales registradas.
      </Typography>
    );

  return (
    <Box>
      {appts.map((a) => (
        <ApptAccordion
          key={a.id}
          a={a}
          expanded={expandedAppt === a.id}
          onToggle={handleToggleAppt}
        />
      ))}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// TreatmentCasesPanel — componente principal
// ─────────────────────────────────────────────────────────────
export default function TreatmentCasesPanel({ patientId }) {
  const { cases, loading, fetchByPatient, updateCaseStatus } =
    useTreatmentCaseStore();
  const role = useAuthStore((s) => s.role);

  const [tab, setTab] = useState(0);
  const [expandedCase, setExpandedCase] = useState(null);
  const [feedback, setFeedback] = useState("");

  const canManage = useMemo(
    () => ["ADMIN", "DOCTOR", "ASSISTANT"].includes(role),
    [role],
  );

  useEffect(() => {
    fetchByPatient(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const handleTabChange = useCallback((_, v) => setTab(v), []);

  const handleToggleCase = useCallback((id) => setExpandedCase(id), []);

  const handleStatusChange = useCallback(
    async (caseId, status) => {
      const { error } = await updateCaseStatus(caseId, status);
      if (error) setFeedback("Error: " + error);
      else {
        setFeedback("Estado actualizado.");
        fetchByPatient(patientId);
      }
    },
    [updateCaseStatus, fetchByPatient, patientId],
  );

  const clearFeedback = useCallback(() => setFeedback(""), []);

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        variant="fullWidth"
      >
        <Tab label="Multisesión" sx={{ fontSize: 13 }} />
        <Tab label="Individuales" sx={{ fontSize: 13 }} />
      </Tabs>

      {feedback && (
        <Alert
          severity={feedback.startsWith("Error") ? "error" : "success"}
          sx={{ mb: 2 }}
          onClose={clearFeedback}
        >
          {feedback}
        </Alert>
      )}

      {/* Tab 0: Multisesión */}
      {tab === 0 && (
        <>
          {loading ? (
            <Box sx={{ py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : cases.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin tratamientos multisesión registrados.
            </Typography>
          ) : (
            cases.map((c) => (
              <CaseAccordion
                key={c.id}
                c={c}
                expanded={expandedCase === c.id}
                onToggle={handleToggleCase}
                canManage={canManage}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </>
      )}

      {/* Tab 1: Individuales */}
      {tab === 1 && <IndividualTreatmentsSection patientId={patientId} />}
    </Box>
  );
}
