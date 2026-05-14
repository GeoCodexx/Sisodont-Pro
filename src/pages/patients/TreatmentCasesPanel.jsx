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
const METHOD_COLORS = {
  efectivo: "default",
  tarjeta: "success",
  transferencia: "info",
  yape: "primary",
  plin: "secondary",
};

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

// ── Sección de pagos de un caso ───────────────────────────────
function CasePaymentsSection({ caseData, onRefresh }) {
  /*const { payments, saving, fetchByCase, registerPayment, deletePayment } =
    useCasePaymentStore();*/
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

  const [form, setForm] = useState({
    amount: "",
    method: "efectivo",
    notes: "",
  });
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  // Saldo viene directamente de la vista (calculado en BD)
  const totalBilled = Number(caseData.total_billed ?? 0);
  const totalPaid = Number(caseData.total_paid ?? 0);
  const totalBalance = Number(caseData.total_balance ?? 0);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    fetchByCase(caseData.id);
  }, [caseData.id]);

  const handleRegister = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
      return;
    }
    if (totalBilled > 0 && amount > totalBalance + 0.01) {
      setFeedback({
        msg: `El monto supera el saldo (${fmtS(totalBalance)}).`,
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
      setFeedback({ msg: "Pago registrado correctamente.", type: "success" });
      setForm({ amount: "", method: "efectivo", notes: "" });
      // Refrescar el caso desde la BD para obtener saldos actualizados
      onRefresh();
    }
  };

  const handleDelete = async (payId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const { error } = await deletePayment(payId, caseData.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else {
      setFeedback({ msg: "Pago eliminado.", type: "success" });
      onRefresh();
    }
  };

  return (
    <Box>
      {/* Resumen financiero — datos de la vista, no calculados en frontend */}
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

      {/* Historial de pagos */}
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

      {/* Registrar nuevo pago */}
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
                {saving ? "Registrando..." : "Registrar"}
              </Button>
            </Box>
          </>
        )}

      {totalBalance <= 0 && totalPaid > 0 && (
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

  if (loading)
    return (
      <Box sx={{ py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );

  if (cases.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
        const balance = Number(c.total_balance ?? 0);
        const paid = Number(c.total_paid ?? 0);
        const billed = Number(c.total_billed ?? 0);

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
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                    {c.treatment_name ?? "—"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Dr. {c.doctor_name ?? "—"} · Inicio: {fmtDate(c.started_at)}
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
                  <Chip label={meta.label} color={meta.color} size="small" />
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0 }}>
              {/* Info del caso */}
              <Box
                sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap", pt: 1 }}
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
                      Notas
                    </Typography>
                    <Typography variant="body2">{c.notes}</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Pagos — saldo de la BD, no calculado en frontend */}
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
              <CasePaymentsSection
                caseData={c}
                onRefresh={() => fetchByPatient(patientId)}
              />

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
      })}
    </Box>
  );
}
