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
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useTreatmentCaseStore } from "../../stores/useTreatmentCaseStore";
import { useCasePaymentStore } from "../../stores/useCasePaymentStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRole } from "../../hooks/useRole";
import { usePaymentStore } from "../../stores/usePaymentStore";
import { supabase } from "../../services/supabaseClient";

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

// ── Lista de pagos en móvil (cards) ──────────────────────────
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

// ── Tabla de pagos en desktop ─────────────────────────────────
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
                sx={{
                  color: "text.secondary",
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
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
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

// ── Formulario de registro de pago ────────────────────────────
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

// ── Sección pagos de CASO multisesión ─────────────────────────
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
  const payments = paymentsByCase[caseData.id] ?? [];
  const { profile } = useAuthStore();
  const { can } = useRole();

  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  const totalBilled = Number(caseData.total_billed ?? 0);
  /*const totalPaid = Number(caseData.total_paid ?? 0);
  const totalBalance = Number(caseData.total_balance ?? 0);*/
  const paymentsTotal = payments.reduce(
    (acc, p) => acc + Number(p.amount || 0),
    0,
  );

  const totalPaid = paymentsTotal;

  const totalBalance = Number(caseData.total_billed ?? 0) - paymentsTotal;

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
    const { error } = await registerPayment({
      caseId: caseData.id,
      amount,
      method: form.method,
      notes: form.notes,
      createdBy: profile?.id,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      //onRefresh();
    }
  };

  const handleDelete = async (payId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await deletePayment(payId, caseData.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago eliminado.", type: "success" });
      //onRefresh();
    }
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
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Sin pagos registrados aún.
        </Typography>
      ) : isMobile ? (
        <Box mb={1.5}>
          {payments.map((p) => (
            <PaymentCard
              key={p.id}
              p={p}
              onDelete={handleDelete}
              canDelete={can(["ADMIN"])}
            />
          ))}
        </Box>
      ) : (
        <PaymentTable
          payments={payments}
          onDelete={handleDelete}
          canDelete={can(["ADMIN"])}
        />
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

// ── Sección pagos de CITA individual ─────────────────────────
function AppointmentPaymentsSection({ appt, onRefresh }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  //const { registerAppointmentPayment, saving } = usePaymentStore();
  const {
    registerAppointmentPayment,
    deleteAppointmentPayment,
    fetchPaymentsByAppointment,
    paymentsByAppointment,
    saving,
  } = usePaymentStore();
  const { profile } = useAuthStore();
  const { can } = useRole();

  //const [payments, setPayments] = useState([]);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  //const balance = Number(appt.total ?? 0) - Number(appt.paid ?? 0);

  const payments = paymentsByAppointment[appt.id] ?? [];

  const paymentsTotal = payments.reduce(
    (acc, p) => acc + Number(p.amount || 0),
    0,
  );

  const totalPaid = paymentsTotal;

  const balance = Number(appt.total ?? 0) - totalPaid;

  /*const loadPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*, created_by_profile:profiles(full_name)")
      .eq("appointment_id", appt.id)
      .order("created_at");
    setPayments(data ?? []);
  };*/

  useEffect(() => {
    //loadPayments();
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
      createdBy: profile?.id,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      //loadPayments();
      //onRefresh();
    }
  };

  /*const handleDeletePayment = async (payId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await supabase.from("payments").delete().eq("id", payId);
    if (error) {
      setFeedback({ msg: error.message, type: "error" });
      return;
    }
    // Restar del paid en appointment
    const { data: a } = await supabase
      .from("appointments")
      .select("paid")
      .eq("id", appt.id)
      .single();
    const pay = payments.find((p) => p.id === payId);
    await supabase
      .from("appointments")
      .update({ paid: Math.max(0, (a?.paid ?? 0) - Number(pay?.amount ?? 0)) })
      .eq("id", appt.id);
    setFeedback({ msg: "Pago eliminado.", type: "success" });
    loadPayments();
    onRefresh();
  };*/
  const handleDeletePayment = async (payId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;

    const pay = payments.find((p) => p.id === payId);

    const { error } = await deleteAppointmentPayment({
      paymentId: payId,
      appointmentId: appt.id,
      amount: pay?.amount ?? 0,
    });

    if (error) {
      setFeedback({
        msg: error,
        type: "error",
      });
    } else {
      setFeedback({
        msg: "Pago eliminado.",
        type: "success",
      });
    }
  };

  return (
    <Box>
      {/* Resumen */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {[
          ["Total", fmtS(appt.total), "text.primary"],
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
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Sin pagos registrados.
        </Typography>
      ) : isMobile ? (
        <Box mb={1.5}>
          {payments.map((p) => (
            <PaymentCard
              key={p.id}
              p={p}
              onDelete={handleDeletePayment}
              canDelete={can(["ADMIN"])}
            />
          ))}
        </Box>
      ) : (
        <PaymentTable
          payments={payments}
          onDelete={handleDeletePayment}
          canDelete={can(["ADMIN"])}
        />
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
            NUEVO PAGO — Saldo: {fmtS(balance)}
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

// ── Sección de tratamientos individuales ─────────────────────
function IndividualTreatmentsSection({ patientId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("patient_id", patientId)
      .is("case_id", null) // solo citas sin caso (sesión única)
      .order("date", { ascending: false });
    setAppts(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, [patientId]);

  if (loading)
    return (
      <Box sx={{ py: 2 }}>
        <CircularProgress size={18} />
      </Box>
    );

  if (appts.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No hay tratamientos individuales registrados.
      </Typography>
    );
  }

  return (
    <Box>
      {appts.map((a) => (
        <Accordion
          key={a.id}
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
              <ReceiptIcon fontSize="small" color="action" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                  {a.treatment_name ?? "Sin tratamiento"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Dr. {a.doctor_name ?? "—"} · {fmtDT(a.date)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexShrink: 0,
                }}
              >
                {/* Saldo */}
                {Number(a.balance) > 0 && (
                  <Chip
                    label={`Debe ${fmtS(a.balance)}`}
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ fontSize: 10 }}
                  />
                )}
                {Number(a.balance) <= 0 && Number(a.paid) > 0 && (
                  <Chip
                    label="Pagado"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: 10 }}
                  />
                )}
                <Chip
                  label={a.status}
                  size="small"
                  color={APPT_STATUS_COLOR[a.status] ?? "default"}
                  sx={{ textTransform: "capitalize" }}
                />
              </Box>
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 0 }}>
            {/* Info de la cita */}
            <Box
              sx={{ display: "flex", gap: 2, mb: 2, pt: 1, flexWrap: "wrap" }}
            >
              {[
                ["Especialidad", a.specialty_name ?? "—"],
                ["Inicio", fmtDT(a.date)],
                ["Fin", fmtDT(a.end_date)],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
              {a.teeth_count && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Dientes tratados
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {a.teeth_count}
                  </Typography>
                </Box>
              )}
              {a.notes && (
                <Box sx={{ width: "100%" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Notas
                  </Typography>
                  <Typography variant="body2">{a.notes}</Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                display: "block",
                mb: 1.5,
              }}
            >
              PAGOS DE ESTA CITA
            </Typography>
            {/* <AppointmentPaymentsSection appt={a} onRefresh={loadAppointments} /> */}
            <AppointmentPaymentsSection appt={a} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

// ── Panel principal ───────────────────────────────────────────
export default function TreatmentCasesPanel({ patientId }) {
  const { can } = useRole();
  const { cases, loading, fetchByPatient, updateCaseStatus } =
    useTreatmentCaseStore();
  const [tab, setTab] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [expandedCase, setExpandedCase] = useState(null);

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
      {/* Tabs: Multisesión / Individuales */}
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

      {/* ── TAB 0: Tratamientos multisesión ── */}
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
                  onChange={(_, isExpanded) =>
                    setExpandedCase(isExpanded ? c.id : null)
                  }
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
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500 }}
                          noWrap
                        >
                          {c.treatment_name ?? "—"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Dr. {c.doctor_name ?? "—"} · Inicio:{" "}
                          {fmtDate(c.started_at)}
                          {Number(c.sessions_attended) > 0 &&
                            ` · ${c.sessions_attended} sesión(es)`}
                        </Typography>
                      </Box>
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
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
                      sx={{
                        color: "text.secondary",
                        fontWeight: 500,
                        display: "block",
                        mb: 1.5,
                      }}
                    >
                      PAGOS DEL TRATAMIENTO
                    </Typography>
                    <CasePaymentsSection caseData={c} />

                    <Divider sx={{ my: 2 }} />

                    {/* Estado del caso */}
                    {can(["ADMIN", "DOCTOR", "ASSISTANT"]) && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
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

      {/* ── TAB 1: Tratamientos individuales ── */}
      {tab === 1 && (
        <IndividualTreatmentsSection
          patientId={patientId}
          //onRefresh={() => {}}
        />
      )}
    </Box>
  );
}
