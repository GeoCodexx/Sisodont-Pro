import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  MenuItem,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import PaymentsIcon from "@mui/icons-material/Payments";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import LaunchIcon from "@mui/icons-material/Launch";
import { useAppointmentStore } from "../../stores/useAppointmentStore";
import { useRole } from "../../hooks/useRole";
import { useNavigate } from "react-router-dom";
import { usePaymentStore } from "../../stores/usePaymentStore";
import { useAuthStore } from "../../stores/useAuthStore";

const STATUS_META = {
  pendiente: {
    label: "Pendiente",
    color: "warning",
    icon: <PendingIcon fontSize="small" />,
  },
  atendido: {
    label: "Atendido",
    color: "success",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  cancelado: {
    label: "Cancelado",
    color: "error",
    icon: <CancelIcon fontSize="small" />,
  },
};

const METHODS = ["efectivo", "yape", "plin", "transferencia", "tarjeta"];

function Row({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
}

export default function AppointmentDetailDrawer({ open, onClose, onUpdate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { registerAppointmentPayment } = usePaymentStore();
  const { profile } = useAuthStore();

  const {
    selected,
    saving,
    changeStatus,
    updateAppointment,
    deleteAppointment,
    setSelected,
  } = useAppointmentStore();
  const { can } = useRole();

  //const [payment, setPayment] = useState("");

  const [form, setForm] = useState({
    amount: "",
    method: "efectivo",
    notes: "",
  });
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [caseSummary, setCaseSummary] = useState(null); //Agregado para ver saldos reales de tratamiento multisesion
  const [caseFinancials, setCaseFinancials] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);

  useEffect(() => {
    if (selected) {
      loadCaseFinancials();
    }
  }, [selected]);

  const reloadSelected = async () => {
    const { data } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("id", selected.id)
      .single();

    if (data) {
      setSelected(data);
    }
  };

  const loadCaseFinancials = async () => {
    if (!selected?.case_id || !selected?.is_multisession) {
      setCaseFinancials(null);
      return;
    }

    setLoadingCase(true);

    const { data, error } = await supabase
      .from("payments_summary")
      .select("*")
      .eq("payment_type", "case")
      .eq("ref_id", selected.case_id)
      .single();

    if (!error && data) {
      setCaseFinancials({
        total: Number(data.total ?? 0),
        paid: Number(data.paid ?? 0),
        balance: Number(data.balance ?? 0),
      });
    }

    setLoadingCase(false);
  };

  if (!selected) return null;

  const isCaseAppointment = selected?.is_multisession && selected?.case_id;
  const paymentInfo = isCaseAppointment
    ? (caseFinancials ?? {
        total: 0,
        paid: 0,
        balance: 0,
      })
    : {
        total: Number(selected?.total ?? 0),
        paid: Number(selected?.paid ?? 0),
        balance: Number(selected?.total ?? 0) - Number(selected?.paid ?? 0),
      };

  const balance = paymentInfo.balance;
  const meta = STATUS_META[selected.status] ?? STATUS_META.pendiente;

  const setField = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleStatus = async (status) => {
    const { error } = await changeStatus(selected.id, status);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Estado actualizado.", type: "success" });
      onUpdate();
    }
  };

  /*const handlePayment = async () => {
    const amount = parseFloat(payment);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
      return;
    }
    if (amount > balance + 0.001) {
      setFeedback({ msg: "El pago supera el saldo.", type: "error" });
      return;
    }
    const { error } = await updateAppointment(selected.id, {
      paid: (selected.paid ?? 0) + amount,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setPayment("");
      onUpdate();
    }
  };*/
  /*const handlePayment = async () => {
    const amount = parseFloat(payment);

    if (!amount || amount <= 0) {
      setFeedback({
        msg: "Ingresa un monto válido.",
        type: "error",
      });
      return;
    }

    if (amount > balance + 0.001) {
      setFeedback({
        msg: "El pago supera el saldo.",
        type: "error",
      });
      return;
    }

    const { error } = await registerAppointmentPayment({
      appointmentId: selected.id,
      amount,
      method: "efectivo",
      notes: null,
      createdBy: profile?.id,
    });

    if (error) {
      setFeedback({
        msg: error,
        type: "error",
      });
    } else {
      setFeedback({
        msg: "Pago registrado.",
        type: "success",
      });

      setPayment("");
      await reloadSelected();
      onUpdate();
    }
  };*/
  const handlePayment = async () => {
    const amount = parseFloat(form.amount);

    if (!amount || amount <= 0) {
      setFeedback({
        msg: "Ingresa un monto válido.",
        type: "error",
      });

      return;
    }

    if (amount > balance + 0.001) {
      setFeedback({
        msg: "El pago supera el saldo.",
        type: "error",
      });

      return;
    }

    const { error } = await registerAppointmentPayment({
      appointmentId: selected.id,
      amount,
      method: form.method,
      notes: form.notes || null,
      createdBy: profile?.id,
    });

    if (error) {
      setFeedback({
        msg: error,
        type: "error",
      });

      return;
    }

    setFeedback({
      msg: "Pago registrado.",
      type: "success",
    });

    setForm({
      amount: "",
      method: "efectivo",
      notes: "",
    });

    await reloadSelected();

    if (isCaseAppointment) {
      await loadCaseFinancials();
    }

    onUpdate();
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta cita?")) return;
    const { error } = await deleteAppointment(selected.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      onClose();
      onUpdate();
    }
  };

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleString("es-PE", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  return (
    <Drawer
      anchor={isMobile ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: isMobile
            ? {
                borderRadius: "16px 16px 0 0",
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
              }
            : { width: 400, p: 3 },
        },
      }}
    >
      {/* Handle visual en móvil */}
      {isMobile && (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5 }}>
          <Box
            sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }}
          />
        </Box>
      )}

      {/* Contenido scrollable */}
      <Box sx={{ flex: 1, overflow: "auto", p: isMobile ? 2.5 : 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {isCaseAppointment ? "Sesión de tratamiento" : "Detalle de cita"}
            </Typography>
            <Chip
              icon={meta.icon}
              label={meta.label}
              color={meta.color}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
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

        {/* Info de la cita — 2 columnas en móvil para aprovechar espacio */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            mb: 0,
          }}
        >
          <Row label="Paciente" value={selected.patient_name} />
          <Row label="Doctor" value={selected.doctor_name} />
          <Row label="Tratamiento" value={selected.treatment_name} />
          {isCaseAppointment && (
            <Chip
              label="Tratamiento multisesión"
              //color="primary"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
          <Row label="Especialidad" value={selected.specialty_name} />
        </Box>
        <Row label="Fecha inicio" value={fmt(selected.date)} />
        <Row label="Fecha fin" value={fmt(selected.end_date)} />
        {selected.notes && <Row label="Notas" value={selected.notes} />}

        <Divider sx={{ my: 2 }} />

        {/* Pagos */}
        <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1.5 }}>
          {isCaseAppointment ? "Resumen financiero del tratamiento" : "Pagos"}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 1,
            mb: 2,
          }}
        >
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 2,
              p: 1,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              Total
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              S/ {paymentInfo.total.toFixed(2)}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 2,
              p: 1,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              Pagado
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "success.main", fontWeight: 500 }}
            >
              S/ {paymentInfo.paid.toFixed(2)}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 2,
              p: 1,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              Saldo
            </Typography>
            {loadingCase ? (
              <CircularProgress size={20} />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: balance > 0 ? "error.main" : "text.secondary",
                  fontWeight: 500,
                }}
              >
                S/ {paymentInfo.balance.toFixed(2)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ───────── PAGOS ───────── */}

        {isCaseAppointment ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Esta cita pertenece a un tratamiento multisesión. Los pagos se
              gestionan desde el tratamiento.
            </Alert>

            <Button
              fullWidth
              variant="contained"
              sx={{ mb: 2 }}
              onClick={() => {
                const patientId = selected.patient_id;
                const caseId = selected.case_id;
                onClose();
                setTimeout(
                  () => navigate(`/patients/${patientId}?case=${caseId}`),
                  150,
                );
              }}
            >
              Ver tratamiento y pagos
            </Button>
          </>
        ) : (
          <>
            {can(["ADMIN", "ASSISTANT"]) && balance > 0 && (
              <>
                <Divider sx={{ mb: 1.5 }} />

                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                    display: "block",
                    mb: 1.5,
                  }}
                >
                  REGISTRAR PAGO — Saldo: S/ {balance.toFixed(2)}
                </Typography>

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  {/* Monto */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Monto"
                      type="number"
                      value={form.amount}
                      onChange={setField("amount")}
                      size="small"
                      slotProps={{
                        htmlInput: {
                          min: 0.01,
                          step: "0.01",
                        },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">S/</InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>

                  {/* Método */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Método"
                      value={form.method}
                      onChange={setField("method")}
                      size="small"
                    >
                      {METHODS.map((m) => (
                        <MenuItem
                          key={m}
                          value={m}
                          sx={{
                            textTransform: "capitalize",
                          }}
                        >
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Notas */}
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Notas"
                      value={form.notes}
                      onChange={setField("notes")}
                      size="small"
                      multiline
                      minRows={2}
                    />
                  </Grid>

                  {/* Botón */}
                  <Grid size={{ xs: 12 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handlePayment}
                      disabled={saving || !form.amount}
                    >
                      {saving ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Registrar pago"
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </>
            )}
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Cambio de estado */}
        {can(["ADMIN", "DOCTOR", "ASSISTANT"]) && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1.5 }}>
              Cambiar estado
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {["pendiente", "atendido", "cancelado"].map((s) => (
                <Button
                  key={s}
                  size="small"
                  variant={selected.status === s ? "contained" : "outlined"}
                  color={STATUS_META[s].color}
                  onClick={() => handleStatus(s)}
                  disabled={saving || selected.status === s}
                  sx={{
                    textTransform: "capitalize",
                    flex: 1,
                    fontSize: { xs: 11, sm: 13 },
                  }}
                >
                  {STATUS_META[s].label}
                </Button>
              ))}
            </Stack>
          </>
        )}

        {can(["ADMIN"]) && (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleDelete}
            disabled={saving}
          >
            Eliminar cita
          </Button>
        )}
      </Box>
    </Drawer>
  );
}
