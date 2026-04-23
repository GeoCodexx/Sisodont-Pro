import { useState } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import { useAppointmentStore } from "../../stores/useAppointmentStore";
import { useRole } from "../../hooks/useRole";

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
  const {
    selected,
    saving,
    changeStatus,
    updateAppointment,
    deleteAppointment,
  } = useAppointmentStore();
  const { can } = useRole();

  const [payment, setPayment] = useState("");
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  if (!selected) return null;

  const balance = (selected.total ?? 0) - (selected.paid ?? 0);
  const meta = STATUS_META[selected.status] ?? STATUS_META.pendiente;

  const handleStatus = async (status) => {
    const { error } = await changeStatus(selected.id, status);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Estado actualizado.", type: "success" });
      onUpdate();
    }
  };

  const handlePayment = async () => {
    const amount = parseFloat(payment);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
      return;
    }
    if (amount > balance + 0.001) {
      setFeedback({ msg: "El pago supera el saldo pendiente.", type: "error" });
      return;
    }

    const newPaid = (selected.paid ?? 0) + amount;
    const { error } = await updateAppointment(selected.id, { paid: newPaid });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setPayment("");
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm("¿Eliminar esta cita? Esta acción no se puede deshacer.")
    )
      return;
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
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: { xs: "100%", sm: 400 }, p: 3 },
        },
      }}
    >
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
          <Typography variant="h6" fontWeight={500}>
            Detalle de cita
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

      {/* Info */}
      <Row label="Paciente" value={selected.patient_name} />
      <Row label="Doctor" value={selected.doctor_name} />
      <Row label="Tratamiento" value={selected.treatment_name} />
      <Row label="Especialidad" value={selected.specialty_name} />
      <Row label="Fecha inicio" value={fmt(selected.date)} />
      <Row label="Fecha fin" value={fmt(selected.end_date)} />
      {selected.notes && <Row label="Notas" value={selected.notes} />}

      <Divider sx={{ my: 2 }} />

      {/* Pagos */}
      <Typography variant="subtitle2" fontWeight={500} mb={1.5}>
        Pagos
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          Total
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          S/ {Number(selected.total).toFixed(2)}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          Pagado
        </Typography>
        <Typography variant="body2" color="success.main" fontWeight={500}>
          S/ {Number(selected.paid).toFixed(2)}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Saldo
        </Typography>
        <Typography
          variant="body2"
          color={balance > 0 ? "error.main" : "text.secondary"}
          fontWeight={500}
        >
          S/ {balance.toFixed(2)}
        </Typography>
      </Box>

      {can(["ADMIN", "ASSISTANT"]) && balance > 0 && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            label="Registrar pago"
            type="number"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">S/</InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" onClick={handlePayment} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : "Agregar"}
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Cambio de estado */}
      {can(["ADMIN", "DOCTOR", "ASSISTANT"]) && (
        <>
          <Typography variant="subtitle2" fontWeight={500} mb={1.5}>
            Cambiar estado
          </Typography>
          <Stack direction="row" spacing={1} mb={2}>
            {["pendiente", "atendido", "cancelado"].map((s) => (
              <Button
                key={s}
                size="small"
                variant={selected.status === s ? "contained" : "outlined"}
                color={STATUS_META[s].color}
                onClick={() => handleStatus(s)}
                disabled={saving || selected.status === s}
                sx={{ textTransform: "capitalize", flex: 1 }}
              >
                {STATUS_META[s].label}
              </Button>
            ))}
          </Stack>
        </>
      )}

      {/* Eliminar */}
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
    </Drawer>
  );
}
