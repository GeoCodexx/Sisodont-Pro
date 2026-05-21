import { supabase } from "../../services/supabaseClient";
import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTreatmentCaseStore } from "../../stores/useTreatmentCaseStore";
import { useCasePaymentStore } from "../../stores/useCasePaymentStore";
import { usePaymentStore } from "../../stores/usePaymentStore";
import { useAuthStore } from "../../stores/useAuthStore";

// ── Constantes ────────────────────────────────────────────────
const STATUS_META = {
  en_curso: {
    label: "En curso",
    color: "primary",
    icon: <FolderOpenIcon fontSize="small" />,
  },
  completado: {
    label: "Completado",
    color: "success",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  abandonado: {
    label: "Abandonado",
    color: "default",
    icon: <FolderIcon fontSize="small" />,
  },
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

// ── Helpers ───────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-PE", { dateStyle: "short" }) : "—";
const fmtDT = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
const fmtS = (n) => "S/ " + Number(n ?? 0).toFixed(2);

// ── PaymentCard — vista móvil ─────────────────────────────────
const PaymentCard = React.memo(function PaymentCard({
  p,
  onDelete,
  canDelete,
}) {
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
                sx={{ fontWeight: 600, color: "success.main" }}
              >
                {fmtS(p.amount)}
              </Typography>
              <Chip
                label={p.method}
                size="small"
                variant="outlined"
                color={METHOD_COLORS[p.method] ?? "default"}
                sx={{ textTransform: "capitalize", fontSize: 10, height: 18 }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              {fmtDT(p.created_at)} · {p.created_by_profile?.full_name ?? "—"}
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
          {canDelete && (
            <Tooltip title="Eliminar pago">
              <IconButton
                size="small"
                onClick={() => onDelete(p.id)}
                sx={{ ml: 1 }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

// ── PaymentTable — vista desktop ──────────────────────────────
const PaymentTable = React.memo(function PaymentTable({
  payments,
  onDelete,
  canDelete,
}) {
  return (
    <Table size="small" sx={{ mb: 1.5 }}>
      <TableHead>
        <TableRow>
          <TableCell>Fecha</TableCell>
          <TableCell>Monto</TableCell>
          <TableCell>Método</TableCell>
          <TableCell>Notas</TableCell>
          <TableCell>Registrado por</TableCell>
          {canDelete && <TableCell align="right" />}
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
                sx={{ fontWeight: 500, color: "success.main" }}
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
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  maxWidth: 180,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.notes || "—"}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" color="textSecondary">
                {p.created_by_profile?.full_name ?? "—"}
              </Typography>
            </TableCell>
            {canDelete && (
              <TableCell align="right">
                <Tooltip title="Eliminar pago">
                  <IconButton size="small" onClick={() => onDelete(p.id)}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

// ── PaymentForm — formulario de nuevo pago ────────────────────
function PaymentForm({ onRegister, saving, maxAmount, showLimit }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [form, setForm] = useState({
    amount: "",
    method: "efectivo",
    notes: "",
  });
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    onRegister(form);
    setForm({ amount: "", method: "efectivo", notes: "" });
  };

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
        value={form.amount}
        onChange={set("amount")}
        size="small"
        sx={{ width: { xs: "100%", sm: 130 } }}
        slotProps={{
          htmlInput: { min: 0.01, step: "0.01" },
          input: {
            startAdornment: (
              <InputAdornment position="start">S/</InputAdornment>
            ),
          },
        }}
        helperText={showLimit && maxAmount > 0 ? `Máx: ${fmtS(maxAmount)}` : ""}
      />
      <TextField
        select
        label="Método"
        value={form.method}
        onChange={set("method")}
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
        value={form.notes}
        onChange={set("notes")}
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
}

// ── CasePaymentsSection ───────────────────────────────────────
// createdBy se lee internamente desde el store.
// El componente no necesita recibirlo como prop.
function CasePaymentsSection({ caseData }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    paymentsByCase,
    saving,
    fetchByCase,
    registerPayment,
    deletePayment,
  } = useCasePaymentStore();

  // createdBy viene del store, no del componente padre
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.role);

  const payments = paymentsByCase[caseData.id] ?? [];
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  const totalBilled = Number(caseData.total_billed ?? 0);
  const paymentsTotal = payments.reduce(
    (acc, p) => acc + Number(p.amount || 0),
    0,
  );
  const totalPaid = paymentsTotal;
  const totalBalance = totalBilled - paymentsTotal;

  const canDelete = role === "ADMIN";
  const canPay = role === "ADMIN" || role === "ASSISTANT";

  useEffect(() => {
    fetchByCase(caseData.id);
  }, [caseData.id, fetchByCase]);

  const handleRegister = async (form) => {
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
    // createdBy se resuelve en el store, no aquí
    const { error } = await registerPayment({
      caseId: caseData.id,
      amount,
      method: form.method,
      notes: form.notes,
      createdBy: userId,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else setFeedback({ msg: "Pago registrado.", type: "success" });
  };

  const handleDelete = async (payId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await deletePayment(payId, caseData.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else setFeedback({ msg: "Pago eliminado.", type: "success" });
  };

  return (
    <Box>
      {/* Resumen financiero */}
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
          ["Pagado", fmtS(totalPaid), "success.main"],
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
              borderRadius: 1.5,
              p: 1.25,
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
            <PaymentCard
              key={p.id}
              p={p}
              onDelete={handleDelete}
              canDelete={canDelete}
            />
          ))}
        </Box>
      ) : (
        <PaymentTable
          payments={payments}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
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

// ── AppointmentPaymentsSection ────────────────────────────────
function AppointmentPaymentsSection({ appt }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    registerAppointmentPayment,
    deleteAppointmentPayment,
    fetchPaymentsByAppointment,
    paymentsByAppointment,
    saving,
  } = usePaymentStore();

  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.role);

  const payments = paymentsByAppointment[appt.id] ?? [];
  const paymentsTotal = payments.reduce(
    (acc, p) => acc + Number(p.amount || 0),
    0,
  );
  const totalPaid = paymentsTotal;
  const balance = Number(appt.total ?? 0) - totalPaid;

  const canDelete = role === "ADMIN";
  const canPay = role === "ADMIN" || role === "ASSISTANT";

  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  useEffect(() => {
    fetchPaymentsByAppointment(appt.id);
  }, [appt.id, fetchPaymentsByAppointment]);

  const handleRegister = async (form) => {
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
    const { error } = await registerAppointmentPayment({
      appointmentId: appt.id,
      amount,
      method: form.method,
      notes: form.notes,
      createdBy: userId,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else setFeedback({ msg: "Pago registrado.", type: "success" });
  };

  const handleDeletePayment = async (payId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const pay = payments.find((p) => p.id === payId);
    const { error } = await deleteAppointmentPayment({
      paymentId: payId,
      appointmentId: appt.id,
      amount: pay?.amount ?? 0,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else setFeedback({ msg: "Pago eliminado.", type: "success" });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {[
          ["Total", fmtS(appt.total ?? 0), "text.primary"],
          ["Pagado", fmtS(totalPaid), "success.main"],
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
              borderRadius: 1.5,
              p: 1.25,
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

      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sin pagos registrados.
        </Typography>
      ) : isMobile ? (
        <Box mb={1.5}>
          {payments.map((p) => (
            <PaymentCard
              key={p.id}
              p={p}
              onDelete={handleDeletePayment}
              canDelete={canDelete}
            />
          ))}
        </Box>
      ) : (
        <PaymentTable
          payments={payments}
          onDelete={handleDeletePayment}
          canDelete={canDelete}
        />
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

// ── IndividualTreatmentsSection ───────────────────────────────
// Citas individuales = appointments_full donde case_id IS NULL.
// Se consultan directamente aquí — no viven en useTreatmentCaseStore
// que solo gestiona casos multisesión.
function IndividualTreatmentsSection({ patientId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const role = useAuthStore((s) => s.role);

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
      {appts.map((a) => {
        const statusColor = APPT_STATUS_COLOR[a.status] ?? "default";
        return (
          <Accordion
            key={a.id}
            expanded={expandedAppt === a.id}
            onChange={(_, open) => setExpandedAppt(open ? a.id : null)}
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
                  <Typography variant="caption" color="text.secondary">
                    {fmtDT(a.date)} · Dr. {a.doctor_name ?? "—"}
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
      })}
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

  const canManage = ["ADMIN", "DOCTOR", "ASSISTANT"].includes(role);

  useEffect(() => {
    fetchByPatient(patientId);
  }, [patientId]);

  const handleStatusChange = async (caseId, status) => {
    const { error } = await updateCaseStatus(caseId, status);
    if (error) setFeedback("Error: " + error);
    else {
      setFeedback("Estado actualizado.");
      fetchByPatient(patientId);
    }
  };

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
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
          onClose={() => setFeedback("")}
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
            cases.map((c) => {
              const meta = STATUS_META[c.status] ?? STATUS_META.en_curso;
              const balance = Number(c.total_balance ?? 0);
              const paid = Number(c.total_paid ?? 0);
              const billed = Number(c.total_billed ?? 0);

              return (
                <Accordion
                  key={c.id}
                  expanded={expandedCase === c.id}
                  onChange={(_, open) => setExpandedCase(open ? c.id : null)}
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
                        <Typography variant="caption" color="text.secondary">
                          Dr. {c.doctor_name ?? "—"} · Inicio:{" "}
                          {fmtDate(c.started_at)}
                          {Number(c.sessions_attended) > 0 &&
                            ` · ${c.sessions_attended} sesión(es)`}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
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
                        <Chip
                          label={meta.label}
                          color={meta.color}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0 }}>
                    {/* Info sesiones */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        mb: 2,
                        pt: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {[
                        ["Sesiones realizadas", c.sessions_attended ?? 0],
                        ["Sesiones planificadas", c.total_sessions ?? "—"],
                        ["Sesiones pendientes", c.sessions_pending ?? 0],
                      ].map(([label, value]) => (
                        <Box key={label}>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block" }}
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
                            sx={{ color: "text.secondary", display: "block" }}
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

                    {/* Cambio de estado */}
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
                            onClick={() => handleStatusChange(c.id, s)}
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
            })
          )}
        </>
      )}

      {/* Tab 1: Individuales */}
      {tab === 1 && <IndividualTreatmentsSection patientId={patientId} />}
    </Box>
  );
}
