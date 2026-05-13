import { useEffect, useState } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTreatmentCaseStore } from "../../stores/useTreatmentCaseStore";
import { useCasePaymentStore } from "../../stores/useCasePaymentStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRole } from "../../hooks/useRole";

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

const METHODS = ["efectivo", "tarjeta", "transferencia", "yape", "plin"];

function fmt(iso) {
  return iso
    ? new Date(iso).toLocaleDateString("es-PE", { dateStyle: "short" })
    : "—";
}
function fmtDT(iso) {
  return iso
    ? new Date(iso).toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
}

// ── Panel de pagos de un caso ─────────────────────────────────
function CasePaymentsSection({ caseId, totalCost, onRefresh }) {
  const { payments, saving, fetchByCase, registerPayment, deletePayment } =
    useCasePaymentStore();
  const { profile } = useAuthStore();
  const { can } = useRole();

  const [form, setForm] = useState({
    amount: "",
    method: "efectivo",
    notes: "",
  });
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Math.max(0, Number(totalCost ?? 0) - totalPaid);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    fetchByCase(caseId);
  }, [caseId]);

  const handleRegister = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Monto inválido.", type: "error" });
      return;
    }
    if (amount > balance + 0.001) {
      setFeedback({
        msg: `Supera el saldo (S/ ${balance.toFixed(2)}).`,
        type: "error",
      });
      return;
    }
    const { error } = await registerPayment({
      caseId,
      amount,
      method: form.method,
      notes: form.notes,
      createdBy: profile?.id,
    });
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago registrado.", type: "success" });
      setForm({ amount: "", method: "efectivo", notes: "" });
      onRefresh();
    }
  };

  const handleDelete = async (payId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await deletePayment(payId, caseId);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago eliminado.", type: "success" });
      onRefresh();
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
          [
            "Costo total",
            `S/ ${Number(totalCost ?? 0).toFixed(2)}`,
            "text.primary",
          ],
          ["Total pagado", `S/ ${totalPaid.toFixed(2)}`, "success.main"],
          [
            "Saldo pendiente",
            `S/ ${balance.toFixed(2)}`,
            balance > 0 ? "error.main" : "text.secondary",
          ],
        ].map(([label, value, color]) => (
          <Box
            key={label}
            sx={{
              bgcolor: "action.hover",
              borderRadius: 1.5,
              p: 1,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {label}
            </Typography>
            <Typography variant="body2" fontWeight={600} color={color}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Historial de pagos */}
      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          Sin pagos registrados.
        </Typography>
      ) : (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Registrado por</TableCell>
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
                    S/ {Number(p.amount).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.method}
                    size="small"
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

      {/* Registrar nuevo pago */}
      {can(["ADMIN", "ASSISTANT"]) && balance > 0 && (
        <>
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
            color="text.secondary"
            fontWeight={500}
            display="block"
            mb={1}
          >
            REGISTRAR PAGO — Saldo: S/ {balance.toFixed(2)}
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
              {saving ? "Registrando..." : "Registrar"}
            </Button>
          </Box>
        </>
      )}

      {balance <= 0 && totalPaid > 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1 }}>
          Tratamiento completamente pagado.
        </Alert>
      )}
    </Box>
  );
}

// ── Panel principal ───────────────────────────────────────────
export default function TreatmentCasesPanel({ patientId }) {
  const { can } = useRole();
  const { cases, loading, fetchByPatient, updateCaseStatus } =
    useTreatmentCaseStore();
  const [feedback, setFeedback] = useState("");

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

  if (loading) return <CircularProgress size={20} />;

  if (cases.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Este paciente no tiene tratamientos multisesión registrados.
      </Typography>
    );
  }

  return (
    <Box>
      {feedback && (
        <Alert
          severity={feedback.startsWith("Error") ? "error" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setFeedback("")}
        >
          {feedback}
        </Alert>
      )}

      {cases.map((c) => {
        const meta = STATUS_META[c.status] ?? STATUS_META.en_curso;
        return (
          <Accordion
            key={c.id}
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
                    Dr. {c.doctor_name ?? "—"} · Inicio: {fmt(c.started_at)}
                    {c.sessions_attended > 0 &&
                      ` · ${c.sessions_attended} sesión(es)`}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  {/* Indicador de saldo */}
                  {Number(c.total_balance) > 0 && (
                    <Chip
                      label={`Debe S/ ${Number(c.total_balance).toFixed(2)}`}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  )}
                  {Number(c.total_balance) <= 0 && Number(c.total_paid) > 0 && (
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
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              {/* Sesiones */}
              <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                {[
                  ["Sesiones realizadas", c.sessions_attended ?? 0],
                  ["Sesiones planificadas", c.total_sessions ?? "—"],
                  ["Sesiones pendientes", c.sessions_pending ?? 0],
                ].map(([label, value]) => (
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
                      Notas
                    </Typography>
                    <Typography variant="body2">{c.notes}</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Pagos del caso */}
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                display="block"
                mb={1}
              >
                PAGOS DEL TRATAMIENTO
              </Typography>
              <CasePaymentsSection
                caseId={c.id}
                totalCost={c.total_cost ?? c.total_billed}
                onRefresh={() => fetchByPatient(patientId)}
              />

              <Divider sx={{ my: 2 }} />

              {/* Cambio de estado */}
              {can(["ADMIN", "DOCTOR", "ASSISTANT"]) && (
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Estado del caso:
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
      })}
    </Box>
  );
}
