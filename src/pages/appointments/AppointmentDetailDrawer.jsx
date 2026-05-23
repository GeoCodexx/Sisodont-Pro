import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
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
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

import { useAppointmentStore } from "../../stores/useAppointmentStore";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { useTreatmentCaseStore } from "../../stores/useTreatmentCaseStore";
import { useLedgerStore } from "../../stores/useLedgerStore";
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

const METHODS = ["efectivo", "yape", "plin", "transferencia", "tarjeta"];

// ─────────────────────────────────────────────────────────────
// Row — memo: componente puramente presentacional.
// ─────────────────────────────────────────────────────────────
const Row = memo(function Row({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// EditSection — memo: sólo re-renderiza si cambia `selected`.
// ─────────────────────────────────────────────────────────────
const EditSection = memo(function EditSection({ selected, onSaved, onCancel }) {
  const { doctors, treatments, fetchAll } = useCatalogStore();
  const { findOpenCase, createCase } = useTreatmentCaseStore();
  const { updateAppointment } = useAppointmentStore();

  const [form, setForm] = useState({
    treatment_id: selected.treatment_id ?? "",
    doctor_id: selected.doctor_id ?? "",
    total: String(selected.total ?? "0"),
    notes: selected.notes ?? "",
  });
  const [totalCost, setTotalCost] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [caseNotes, setCaseNotes] = useState("");
  const [openCase, setOpenCase] = useState(null);
  const [checkingCase, setCheckingCase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [teethCount, setTeethCount] = useState("");
  const [unitPrice, setUnitPrice] = useState("50");

  const set = useCallback(
    (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value })),
    [],
  );

  const selectedTreatment = useMemo(
    () => treatments.find((t) => t.id === form.treatment_id) ?? null,
    [treatments, form.treatment_id],
  );
  const isMultisession = selectedTreatment?.is_multisession === true;
  const isObturacion = useMemo(
    () => selectedTreatment?.name?.toUpperCase().includes("OBTURACIÓN") ?? false,
    [selectedTreatment],
  );

  const filteredDoctors = useMemo(
    () =>
      selectedTreatment?.specialty_id
        ? doctors.filter((d) => d.specialty_id === selectedTreatment.specialty_id)
        : doctors,
    [doctors, selectedTreatment?.specialty_id],
  );

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!selectedTreatment) return;

    if (isObturacion) {
      setTeethCount("");
      if (selectedTreatment.unit_price)
        setUnitPrice(String(selectedTreatment.unit_price));
      setForm((f) => ({ ...f, total: "" }));
      setOpenCase(null);
      return;
    }

    if (!isMultisession) {
      setForm((f) => ({ ...f, total: String(selectedTreatment.price ?? "0") }));
      setOpenCase(null);
      return;
    }

    setTotalCost(String(selectedTreatment.price ?? ""));
    setCheckingCase(true);
    findOpenCase(selected.patient_id, form.treatment_id).then((found) => {
      setOpenCase(found);
      setCheckingCase(false);
      setForm((f) => ({ ...f, total: "0" }));
    });
  }, [form.treatment_id]);

  const handleSave = useCallback(async () => {
    setError("");
    if (!form.doctor_id) { setError("Selecciona un doctor."); return; }

    setSaving(true);
    let caseId = selected.case_id ?? null;

    if (isMultisession) {
      if (openCase) {
        caseId = openCase.id;
      } else {
        if (!totalCost) {
          setError("Ingresa el costo total pactado.");
          setSaving(false);
          return;
        }
        const { data: newCase, error: caseError } = await createCase({
          patient_id: selected.patient_id,
          treatment_id: form.treatment_id,
          doctor_id: form.doctor_id,
          notes: caseNotes || null,
          total_sessions: totalSessions ? parseInt(totalSessions) : null,
          total_cost: parseFloat(totalCost),
        });
        if (caseError) {
          setError("Error al crear el caso: " + caseError);
          setSaving(false);
          return;
        }
        caseId = newCase.id;
      }
    }

    const { error: updateError } = await updateAppointment(selected.id, {
      treatment_id: form.treatment_id || null,
      doctor_id: form.doctor_id,
      total: parseFloat(form.total) || 0,
      notes: form.notes || null,
      case_id: caseId,
      teeth_count: isObturacion ? parseInt(teethCount) || null : null,
      unit_price: isObturacion ? parseFloat(unitPrice) || null : null,
    });

    setSaving(false);
    if (updateError) { setError(updateError); return; }
    onSaved();
  }, [
    form, isMultisession, isObturacion, openCase, totalCost, caseNotes,
    totalSessions, teethCount, unitPrice, selected, createCase,
    updateAppointment, onSaved,
  ]);

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "primary.light",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500, color: "primary.main", mb: 2 }}>
        ✏️ Editar cita
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={1.5}>
        {/* Tratamiento */}
        <Grid size={{ xs: 12 }}>
          <TextField
            select
            label="Tratamiento"
            value={form.treatment_id}
            onChange={set("treatment_id")}
            size="small"
            fullWidth
          >
            <MenuItem value="">Sin especificar</MenuItem>
            {treatments.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>{t.name}</Typography>
                  {t.is_multisession && (
                    <Chip
                      label="Multisesión"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: 10, height: 18 }}
                    />
                  )}
                  {!t.is_multisession && !t.unit_price && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      S/ {Number(t.price).toFixed(2)}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Doctor */}
        <Grid size={{ xs: 12 }}>
          <TextField
            select
            label="Doctor *"
            value={form.doctor_id}
            onChange={set("doctor_id")}
            size="small"
            fullWidth
          >
            {filteredDoctors.length === 0 && (
              <MenuItem disabled>Sin doctores disponibles</MenuItem>
            )}
            {filteredDoctors.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.profile?.full_name ?? d.id}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Multisesión */}
        {isMultisession && (
          <Grid size={{ xs: 12 }}>
            {checkingCase ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Verificando...
                </Typography>
              </Box>
            ) : openCase ? (
              <Alert severity="info" sx={{ py: 0.5 }}>
                <Typography variant="caption">
                  Se vinculará al caso en curso desde{" "}
                  <strong>
                    {new Date(openCase.started_at).toLocaleDateString("es-PE")}
                  </strong>
                  . Esta sesión tendrá costo S/ 0.
                </Typography>
              </Alert>
            ) : (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "primary.light",
                  borderRadius: 1.5,
                  p: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "primary.main", fontWeight: 500, display: "block", mb: 1 }}
                >
                  Nuevo caso de tratamiento
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="Costo total pactado *"
                      type="number"
                      value={totalCost}
                      onChange={(e) => setTotalCost(e.target.value)}
                      size="small"
                      fullWidth
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">S/</InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="N.° sesiones"
                      type="number"
                      value={totalSessions}
                      onChange={(e) => setTotalSessions(e.target.value)}
                      size="small"
                      fullWidth
                      helperText="Opcional"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Notas del caso"
                      value={caseNotes}
                      onChange={(e) => setCaseNotes(e.target.value)}
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Grid>
        )}

        {/* Obturación dental */}
        {isObturacion && (
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "warning.light",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, color: "warning.dark", mb: 1.5 }}>
                🦷 Obturación dental — cálculo por diente
              </Typography>
              <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Cantidad *"
                    type="number"
                    value={teethCount}
                    onChange={(e) => {
                      setTeethCount(e.target.value);
                      const total =
                        (parseFloat(unitPrice) || 0) * (parseInt(e.target.value) || 0);
                      setForm((f) => ({ ...f, total: total > 0 ? String(total) : "" }));
                    }}
                    size="small"
                    fullWidth
                    autoFocus
                    slotProps={{ htmlInput: { min: 1, max: 32 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Precio por diente"
                    type="number"
                    value={unitPrice}
                    onChange={(e) => {
                      setUnitPrice(e.target.value);
                      const total =
                        (parseFloat(e.target.value) || 0) * (parseInt(teethCount) || 0);
                      setForm((f) => ({ ...f, total: total > 0 ? String(total) : "" }));
                    }}
                    size="small"
                    fullWidth
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">S/</InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      bgcolor: "warning.light",
                      borderRadius: 2,
                      p: 1.5,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="caption" sx={{ display: "block" }}>
                      Total calculado
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      S/{" "}
                      {(
                        (parseFloat(unitPrice) || 0) * (parseInt(teethCount) || 0)
                      ).toFixed(2)}
                    </Typography>
                    {parseInt(teethCount) > 0 && (
                      <Typography variant="caption">
                        {teethCount} × S/ {parseFloat(unitPrice || 0).toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}

        {/* Total — solo sesión única */}
        {!isMultisession && !isObturacion && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Total"
              type="number"
              value={form.total}
              onChange={set("total")}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">S/</InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        )}

        {/* Notas */}
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Notas de la cita"
            value={form.notes}
            onChange={set("notes")}
            size="small"
            fullWidth
            multiline
            rows={2}
          />
        </Grid>

        {/* Acciones */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={handleSave}
              disabled={saving}
              sx={{ flex: 1 }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button variant="outlined" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// AppointmentDetailDrawer — componente principal
// ─────────────────────────────────────────────────────────────
export default function AppointmentDetailDrawer({ open, onClose, onUpdate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { can } = useRole();

  const { selected, saving, changeStatus, deleteAppointment, setSelected } =
    useAppointmentStore();
  const { register } = useLedgerStore();

  const [form, setForm] = useState({ amount: "", method: "efectivo", notes: "" });
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [caseFinancials, setCaseFinancials] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // useMemo: derivados de selected — no recalculan si selected no cambia
  const isCaseAppointment = useMemo(
    () => !!(selected?.is_multisession && selected?.case_id),
    [selected?.is_multisession, selected?.case_id],
  );

  const isConsulta = useMemo(
    () =>
      !selected?.treatment_name ||
      selected.treatment_name.toUpperCase().includes("CONSULTA"),
    [selected?.treatment_name],
  );

  const canEdit = useMemo(
    () =>
      can(["ADMIN", "ASSISTANT"]) &&
      !isCaseAppointment &&
      isConsulta &&
      selected?.status !== "cancelado",
    [can, isCaseAppointment, isConsulta, selected?.status],
  );

  const paymentInfo = useMemo(
    () =>
      isCaseAppointment
        ? (caseFinancials ?? { total: 0, paid: 0, balance: 0 })
        : {
            total: Number(selected?.total ?? 0),
            paid: Number(selected?.paid ?? 0),
            balance: Number(selected?.total ?? 0) - Number(selected?.paid ?? 0),
          },
    [isCaseAppointment, caseFinancials, selected?.total, selected?.paid],
  );

  const balance = paymentInfo.balance;
  const meta = STATUS_META[selected?.status] ?? STATUS_META.pendiente;

  const fmt = useCallback(
    (iso) =>
      iso
        ? new Date(iso).toLocaleString("es-PE", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "—",
    [],
  );

  // useCallback: reload estable — no cambia entre renders
  const reloadSelected = useCallback(async () => {
    if (!selected?.id) return;
    const { data } = await supabase
      .from("appointments_full")
      .select("*")
      .eq("id", selected.id)
      .single();
    if (data) setSelected(data);
  }, [selected?.id, setSelected]);

  const loadCaseFinancials = useCallback(async () => {
    if (!selected?.case_id || !selected?.is_multisession) {
      setCaseFinancials(null);
      return;
    }
    setLoadingCase(true);
    const { data, error } = await supabase
      .from("financial_summary")
      .select("billed, collected, balance")
      .eq("ref_type", "case")
      .eq("ref_id", selected.case_id)
      .single();
    if (!error && data) {
      setCaseFinancials({
        total: Number(data.billed ?? 0),
        paid: Number(data.collected ?? 0),
        balance: Number(data.balance ?? 0),
      });
    } else {
      setCaseFinancials(null);
    }
    setLoadingCase(false);
  }, [selected?.case_id, selected?.is_multisession]);

  useEffect(() => {
    setEditMode(false);
    setFeedback({ msg: "", type: "success" });
    setForm({ amount: "", method: "efectivo", notes: "" });
    if (selected?.id) loadCaseFinancials();
  }, [selected?.id, selected?.case_id, selected?.is_multisession]);

  const setField = useCallback(
    (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value })),
    [],
  );

  const handleStatus = useCallback(
    async (status) => {
      const { error } = await changeStatus(selected.id, status);
      if (error) setFeedback({ msg: error, type: "error" });
      else {
        setFeedback({ msg: "Estado actualizado.", type: "success" });
        onUpdate();
      }
    },
    [changeStatus, selected?.id, onUpdate],
  );

  const handlePayment = useCallback(async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFeedback({ msg: "Ingresa un monto válido.", type: "error" });
      return;
    }
    if (amount > balance + 0.001) {
      setFeedback({ msg: "El pago supera el saldo.", type: "error" });
      return;
    }

    const { error } = await register({
      refType: "appointment",
      refId: selected.id,
      amount,
      method: form.method,
      notes: form.notes || null,
    });

    if (error) { setFeedback({ msg: error, type: "error" }); return; }

    setFeedback({ msg: "Pago registrado.", type: "success" });
    setForm({ amount: "", method: "efectivo", notes: "" });
    await reloadSelected();
    onUpdate();
  }, [form, balance, register, selected?.id, reloadSelected, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("¿Eliminar esta cita?")) return;
    const { error } = await deleteAppointment(selected.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else { onClose(); onUpdate(); }
  }, [deleteAppointment, selected?.id, onClose, onUpdate]);

  const handleEditSaved = useCallback(async () => {
    setEditMode(false);
    await reloadSelected();
    await loadCaseFinancials();
    setFeedback({ msg: "Cita actualizada correctamente.", type: "success" });
    onUpdate();
  }, [reloadSelected, loadCaseFinancials, onUpdate]);

  const handleCancelEdit = useCallback(() => setEditMode(false), []);
  const handleOpenEdit = useCallback(() => setEditMode(true), []);
  const handleCloseFeedback = useCallback(
    () => setFeedback({ msg: "", type: "success" }),
    [],
  );

  const handleNavToPatient = useCallback(() => {
    onClose();
    setTimeout(
      () => navigate(`/patients/${selected.patient_id}?case=${selected.case_id}`),
      150,
    );
  }, [onClose, navigate, selected?.patient_id, selected?.case_id]);

  if (!selected) return null;

  // useMemo: props del paper del Drawer — evita object literal inline
  const drawerPaperSx = isMobile
    ? {
        borderRadius: "16px 16px 0 0",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
      }
    : { width: 420, p: 3 };

  return (
    <Drawer
      anchor={isMobile ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: drawerPaperSx } }}
    >
      {isMobile && (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }} />
        </Box>
      )}

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
            <Box sx={{ display: "flex", gap: 0.75, mt: 0.5, flexWrap: "wrap" }}>
              <Chip icon={meta.icon} label={meta.label} color={meta.color} size="small" />
              {isCaseAppointment && (
                <Chip label="Multisesión" color="primary" variant="outlined" size="small" />
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {canEdit && !editMode && (
              <Tooltip title="Editar cita">
                <IconButton size="small" onClick={handleOpenEdit}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {feedback.msg && (
          <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={handleCloseFeedback}>
            {feedback.msg}
          </Alert>
        )}

        <Divider sx={{ mb: 2 }} />

        {editMode ? (
          <EditSection
            selected={selected}
            onSaved={handleEditSaved}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            {/* Info de la cita */}
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, mb: 0 }}
            >
              <Row label="Paciente" value={selected.patient_name} />
              <Row label="Doctor" value={selected.doctor_name} />
              <Row
                label="Tratamiento"
                value={selected.treatment_name || "Sin especificar"}
              />
              <Row label="Especialidad" value={selected.specialty_name} />
            </Box>
            <Row label="Fecha inicio" value={fmt(selected.date)} />
            <Row label="Fecha fin" value={fmt(selected.end_date)} />
            {selected.teeth_count && (
              <Row
                label="Dientes tratados"
                value={`${selected.teeth_count} diente(s)`}
              />
            )}
            {selected.notes && <Row label="Notas" value={selected.notes} />}

            <Divider sx={{ my: 2 }} />

            {/* Resumen financiero */}
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
              {[
                ["Total", paymentInfo.total, "text.primary"],
                ["Pagado", paymentInfo.paid, "success.main"],
                [
                  "Saldo",
                  paymentInfo.balance,
                  balance > 0 ? "error.main" : "text.secondary",
                ],
              ].map(([label, value, color]) => (
                <Box
                  key={label}
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
                    {label}
                  </Typography>
                  {loadingCase ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 500, color }}>
                      S/ {Number(value ?? 0).toFixed(2)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            {isCaseAppointment ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Los pagos de este tratamiento se gestionan desde la ficha del paciente.
                </Alert>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mb: 2 }}
                  onClick={handleNavToPatient}
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
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Monto"
                          type="number"
                          value={form.amount}
                          onChange={setField("amount")}
                          size="small"
                          slotProps={{
                            htmlInput: { min: 0.01, step: "0.01" },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">S/</InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>
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
                            <MenuItem key={m} value={m} sx={{ textTransform: "capitalize" }}>
                              {m}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
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
                {balance <= 0 && Number(selected.paid ?? 0) > 0 && (
                  <Alert severity="success" icon={false} sx={{ mb: 2 }}>
                    Cita completamente pagada.
                  </Alert>
                )}
              </>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Cambiar estado */}
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
          </>
        )}
      </Box>
    </Drawer>
  );
}