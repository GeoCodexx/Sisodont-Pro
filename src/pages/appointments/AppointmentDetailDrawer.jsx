import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useForm, Controller } from "react-hook-form";
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
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import BlockIcon from "@mui/icons-material/Block";

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
// CancelDialog — modal con textarea de notas para cancelar/eliminar
// ─────────────────────────────────────────────────────────────
const CancelDialog = memo(function CancelDialog({
  open,
  onClose,
  onConfirm,
  preview,
  saving,
}) {
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("efectivo");

  // Limpiar notas al abrir
  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  const handleConfirm = useCallback(() => {
    onConfirm(notes, refundMethod);
  }, [notes, refundMethod, onConfirm]);

  if (!preview) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {preview.action === "delete" ? "Eliminar cita" : "Cancelar cita"}
      </DialogTitle>

      <DialogContent>
        {/* Resumen de la acción que se ejecutará */}
        <Alert
          severity={preview.action === "delete" ? "warning" : "info"}
          sx={{ mb: 2 }}
          icon={
            preview.action === "delete" ? (
              <DeleteOutlineIcon fontSize="inherit" />
            ) : (
              <BlockIcon fontSize="inherit" />
            )
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            {preview.title}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {preview.description}
          </Typography>
        </Alert>

        {preview.action === "cancel" && preview.hasRefund && (
          <TextField
            select
            fullWidth
            size="small"
            label="Canal de devolución"
            value={refundMethod}
            onChange={(e) => setRefundMethod(e.target.value)}
            disabled={saving}
            sx={{ mt: 1.5 }}
          >
            {["efectivo", "yape", "plin", "transferencia", "tarjeta"].map(
              (m) => (
                <MenuItem
                  key={m}
                  value={m}
                  sx={{ textTransform: "capitalize" }}
                >
                  {m}
                </MenuItem>
              ),
            )}
          </TextField>
        )}

        <DialogContentText sx={{ mb: 1.5, fontSize: 14 }}>
          Agrega una nota opcional sobre el motivo de la cancelación:
        </DialogContentText>

        <TextField
          autoFocus
          fullWidth
          multiline
          rows={3}
          size="small"
          label="Motivo / notas"
          placeholder="Ej: Paciente llamó para reprogramar..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Volver
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={saving}
          variant="contained"
          color={preview.action === "delete" ? "error" : "warning"}
          startIcon={
            saving ? (
              <CircularProgress size={14} color="inherit" />
            ) : preview.action === "delete" ? (
              <DeleteOutlineIcon />
            ) : (
              <BlockIcon />
            )
          }
        >
          {saving
            ? "Procesando..."
            : preview.action === "delete"
              ? "Sí, eliminar"
              : "Sí, cancelar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// ─────────────────────────────────────────────────────────────
// useCancelPreview — determina el texto/acción del modal ANTES
// de ejecutar la operación, para que el usuario sepa qué pasará.
// ─────────────────────────────────────────────────────────────
function useCancelPreview(selected) {
  return useMemo(() => {
    if (!selected) return null;

    const isMultisession = !!selected.is_multisession && !!selected.case_id;
    const paid = Number(selected.paid ?? 0);
    const hasPaid = paid > 0;

    // Sesión única
    if (!isMultisession) {
      if (!hasPaid) {
        return {
          action: "delete",
          title: "Se eliminará la cita permanentemente",
          description:
            "Esta cita no tiene pagos registrados, por lo que puede eliminarse de forma segura.",
        };
      }
      return {
        action: "cancel",
        hasRefund: true,
        title: `Se cancelará la cita y se registrará un reembolso de S/ ${paid.toFixed(2)}`,
        description:
          "Como hay pagos registrados, la cita no puede eliminarse. Se marcará como cancelada y se generará una entrada de reembolso en el ledger.",
      };
    }

    // Multisesión — el preview exacto depende de si es la 1.ª cita,
    // lo que solo se sabe consultando la BD. Mostramos un mensaje genérico
    // que cubre ambos sub-casos posibles.
    if (!hasPaid) {
      return {
        action: "delete",
        title: "Se procesará la cancelación del caso",
        description:
          "Si es la primera cita del tratamiento, también se marcará el caso como abandonado. Si es una sesión intermedia, solo se eliminará esta cita.",
      };
    }
    return {
      action: "cancel",
      title: "Se cancelará esta sesión del tratamiento",
      description:
        "Como hay pagos en el caso, la cita se marcará como cancelada. El caso de tratamiento permanecerá activo para reprogramar o gestionar devoluciones desde la ficha del paciente.",
    };
  }, [selected]);
}

// ─────────────────────────────────────────────────────────────
// Row — componente puramente presentacional.
// ─────────────────────────────────────────────────────────────
const Row = memo(function Row({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", display: "block" }}
      >
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// EditSection — sólo re-renderiza si cambia `selected`.
// ─────────────────────────────────────────────────────────────
const EditSection = memo(function EditSection({ selected, onSaved, onCancel }) {
  const { doctors, treatments, fetchAll } = useCatalogStore();
  const { findOpenCase, createCase } = useTreatmentCaseStore();
  const { updateAppointment } = useAppointmentStore();

  const [totalCost, setTotalCost] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [caseNotes, setCaseNotes] = useState("");
  const [openCase, setOpenCase] = useState(null);
  const [checkingCase, setCheckingCase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [teethCount, setTeethCount] = useState("");
  const [unitPrice, setUnitPrice] = useState("50");

  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      treatment_id: selected.treatment_id ?? "",
      doctor_id: selected.doctor_id ?? "",
      total: String(selected.total ?? "0"),
      notes: selected.notes ?? "",
    },
  });

  const watchTreatmentId = watch("treatment_id");

  const selectedTreatment = useMemo(
    () => treatments.find((t) => t.id === watchTreatmentId) ?? null,
    [treatments, watchTreatmentId],
  );

  const isMultisession = selectedTreatment?.is_multisession === true;

  const isObturacion = useMemo(
    () =>
      !!selectedTreatment?.unit_price &&
      (selectedTreatment?.name?.toUpperCase().includes("OBTURACIÓN") ?? false),
    [selectedTreatment],
  );

  const filteredDoctors = useMemo(
    () =>
      selectedTreatment?.specialty_id
        ? doctors.filter(
            (d) => d.specialty_id === selectedTreatment.specialty_id,
          )
        : doctors,
    [doctors, selectedTreatment?.specialty_id],
  );

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedTreatment || !isObturacion) return;
    setTeethCount("");
    setValue("total", "");
    if (selectedTreatment.unit_price)
      setUnitPrice(String(selectedTreatment.unit_price));
  }, [watchTreatmentId, isObturacion]);

  useEffect(() => {
    if (!selectedTreatment || isObturacion || isMultisession) return;
    setValue("total", String(selectedTreatment.effective_price ?? "0"));
  }, [watchTreatmentId, isObturacion, isMultisession]);

  useEffect(() => {
    if (!selectedTreatment || !isMultisession) return;
    setTotalCost(String(selectedTreatment.effective_price ?? ""));
    setCheckingCase(true);
    findOpenCase(selected.patient_id, watchTreatmentId).then((found) => {
      setOpenCase(found);
      setCheckingCase(false);
      setValue("total", "0");
    });
  }, [watchTreatmentId, isMultisession]);

  const onSubmit = useCallback(
    async (data) => {
      setError("");
      if (!data.doctor_id) {
        setError("Selecciona un doctor.");
        return;
      }

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
            treatment_id: data.treatment_id,
            doctor_id: data.doctor_id,
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

      const total = isObturacion
        ? (parseFloat(unitPrice) || 0) * (parseInt(teethCount) || 0)
        : parseFloat(data.total) || 0;

      const { error: updateError } = await updateAppointment(selected.id, {
        treatment_id: data.treatment_id || null,
        doctor_id: data.doctor_id,
        total,
        notes: data.notes || null,
        case_id: caseId,
        teeth_count: isObturacion ? parseInt(teethCount) || null : null,
        unit_price: isObturacion ? parseFloat(unitPrice) || null : null,
      });

      setSaving(false);
      if (updateError) {
        setError(updateError);
        return;
      }
      onSaved();
    },
    [
      isMultisession,
      isObturacion,
      openCase,
      totalCost,
      caseNotes,
      totalSessions,
      teethCount,
      unitPrice,
      selected,
      createCase,
      updateAppointment,
      onSaved,
    ],
  );

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
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, color: "primary.main", mb: 2 }}
      >
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
          <Controller
            name="treatment_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={[{ id: "", name: "Sin especificar" }, ...treatments]}
                getOptionLabel={(t) => t.name ?? ""}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                value={
                  treatments.find((t) => t.id === field.value) ?? {
                    id: "",
                    name: "Sin especificar",
                  }
                }
                onChange={(_, val) => field.onChange(val?.id ?? "")}
                renderOption={(props, t) => (
                  <Box component="li" {...props} key={t.id}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {t.name}
                      </Typography>
                      {t.is_multisession && (
                        <Chip
                          label="Multisesión"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: 10, height: 18, flexShrink: 0 }}
                        />
                      )}
                      {!t.is_multisession && !t.unit_price && t.id && (
                        <Typography
                          variant="caption"
                          sx={{ flexShrink: 0, color: "text.secondary" }}
                        >
                          S/ {Number(t.effective_price).toFixed(2)}
                        </Typography>
                      )}
                      {t.unit_price && (
                        <Typography
                          variant="caption"
                          sx={{ flexShrink: 0, color: "warning.dark" }}
                        >
                          S/ {Number(t.effective_price).toFixed(2)}/ud.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Tratamiento" size="small" />
                )}
              />
            )}
          />
        </Grid>

        {/* Doctor */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="doctor_id"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Doctor *"
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
            )}
          />
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
                  sx={{
                    color: "primary.main",
                    fontWeight: 500,
                    display: "block",
                    mb: 1,
                  }}
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
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "warning.dark", mb: 1.5 }}
              >
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
                      const t =
                        (parseFloat(unitPrice) || 0) *
                        (parseInt(e.target.value) || 0);
                      setValue("total", t > 0 ? String(t) : "");
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
                      const t =
                        (parseFloat(e.target.value) || 0) *
                        (parseInt(teethCount) || 0);
                      setValue("total", t > 0 ? String(t) : "");
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
                    <Typography variant="caption" display="block">
                      Total calculado
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      S/{" "}
                      {(
                        (parseFloat(unitPrice) || 0) *
                        (parseInt(teethCount) || 0)
                      ).toFixed(2)}
                    </Typography>
                    {parseInt(teethCount) > 0 && (
                      <Typography variant="caption">
                        {teethCount} × S/{" "}
                        {parseFloat(unitPrice || 0).toFixed(2)}
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
            <Controller
              name="total"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Total"
                  type="number"
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
              )}
            />
          </Grid>
        )}

        {/* Notas */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Notas de la cita"
                size="small"
                fullWidth
                multiline
                rows={2}
              />
            )}
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
              onClick={handleSubmit(onSubmit)}
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

  const {
    selected,
    saving,
    changeStatus,
    setSelected,
    smartCancelOrDelete,
    cancelAppointment,
  } = useAppointmentStore();
  const { register } = useLedgerStore();

  const [form, setForm] = useState({
    amount: "",
    method: "efectivo",
    notes: "",
  });
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [caseFinancials, setCaseFinancials] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [dialogAction, setDialogAction] = useState(null);
  // "cancel" | "delete"

  // ── Estado del modal de cancelación/eliminación ───────────
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  //const cancelPreview = useCancelPreview(selected);
  const smartPreview = useCancelPreview(selected);

  const cancelPreview = useMemo(() => {
    if (!selected) return null;

    const paid = Number(selected.paid ?? 0);

    // Usuario presionó Cancelar
    if (dialogAction === "cancel") {
      return {
        action: "cancel",
        hasRefund: paid > 0,
        title:
          paid > 0
            ? `Se cancelará la cita y se registrará una devolución de S/ ${paid.toFixed(2)}`
            : "Se cancelará la cita",
        description:
          "La cita quedará marcada como cancelada y permanecerá en el historial.",
      };
    }

    // Usuario presionó Eliminar
    return smartPreview;
  }, [selected, dialogAction, smartPreview]);

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

  // Determina si el botón "Eliminar" debe mostrarse
  const showDeleteButton = useMemo(() => {
    if (!selected) return false;
    const isMulti = !!(selected.is_multisession && selected.case_id);
    const paid = Number(selected.paid ?? 0);
    const isCancelled = selected.status === "cancelado";

    // Cita ya cancelada → siempre mostrar (DELETE físico)
    if (isCancelled) return paid === 0;

    // Sesión única sin pagos → mostrar
    if (!isMulti && paid === 0) return true;

    // Sesión única con pagos → ocultar (la acción queda solo en "Cancelar")
    if (!isMulti && paid > 0) return false;

    // Multisesión (cualquier posición) → siempre ocultar
    return false;
  }, [selected]);

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
      // Interceptar el click en "cancelado" para abrir el modal
      /*if (status === "cancelado") {
        setCancelDialogOpen(true);
        return;
      }*/
      if (status === "cancelado") {
        setDialogAction("cancel");
        setCancelDialogOpen(true);
        return;
      }
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

    if (error) {
      setFeedback({ msg: error, type: "error" });
      return;
    }

    setFeedback({ msg: "Pago registrado.", type: "success" });
    setForm({ amount: "", method: "efectivo", notes: "" });
    await reloadSelected();
    onUpdate();
  }, [form, balance, register, selected?.id, reloadSelected, onUpdate]);

  const handleDeleteClick = useCallback(() => {
    setDialogAction("delete");
    setCancelDialogOpen(true);
  }, []);

  // ── Confirmación desde el modal ───────────────────────────
  const handleCancelConfirm = useCallback(

    async (notes, refundMethod = "efectivo") => {
      let result;

      if (dialogAction === "cancel") {
        result = await cancelAppointment(selected, notes, refundMethod);
      } else {
        result = await smartCancelOrDelete(selected, notes, refundMethod);
      }

      const { action, error, warning } = result;

      if (error) {
        setFeedback({ msg: error, type: "error" });
        setCancelDialogOpen(false);
        return;
      }

      setCancelDialogOpen(false);

      const messages = {
        deleted: "Cita eliminada correctamente.",
        cancelled: "Cita cancelada correctamente.",
        cancelled_with_refund: "Cita cancelada. Se registró un reembolso.",
      };

      setFeedback({
        msg: warning ?? messages[action] ?? "Operación completada.",
        type: warning ? "warning" : "success",
      });

      if (action === "deleted") {
        onClose();
        onUpdate();
      } else {
        await reloadSelected();
        await loadCaseFinancials();
        onUpdate();
      }
    },
    [dialogAction, changeStatus],
  );

  const handleCancelDialogClose = useCallback(() => {
    setCancelDialogOpen(false);
    setDialogAction(null);
  }, []);

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
      () =>
        navigate(`/patients/${selected.patient_id}?case=${selected.case_id}`),
      150,
    );
  }, [onClose, navigate, selected?.patient_id, selected?.case_id]);

  if (!selected) return null;

  const drawerPaperSx = isMobile
    ? {
        borderRadius: "16px 16px 0 0",
        //maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
      }
    : { width: 420, p: 3 };

  return (
    <>
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={open}
        onClose={onClose}
        slotProps={{ paper: { sx: drawerPaperSx } }}
      >
        {isMobile && (
          <Box
            sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5 }}
          >
            <Box
              sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }}
            />
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
                {isCaseAppointment
                  ? "Sesión de tratamiento"
                  : "Detalle de cita"}
              </Typography>
              <Box
                sx={{ display: "flex", gap: 0.75, mt: 0.5, flexWrap: "wrap" }}
              >
                <Chip
                  icon={meta.icon}
                  label={meta.label}
                  color={meta.color}
                  size="small"
                />
                {isCaseAppointment && (
                  <Chip
                    label="Multisesión"
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
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
            <Alert
              severity={feedback.type}
              sx={{ mb: 2 }}
              onClose={handleCloseFeedback}
            >
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
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 0,
                  mb: 0,
                }}
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
                {isCaseAppointment
                  ? "Resumen financiero del tratamiento"
                  : "Pagos"}
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
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color }}
                      >
                        S/ {Number(value ?? 0).toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>

              {isCaseAppointment ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Los pagos de este tratamiento se gestionan desde la ficha
                    del paciente.
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
                                  <InputAdornment position="start">
                                    S/
                                  </InputAdornment>
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
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 500, mb: 1.5 }}
                  >
                    Cambiar estado
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {["pendiente", "atendido", "cancelado"].map((s) => (
                      <Button
                        key={s}
                        size="small"
                        variant={
                          selected.status === s ? "contained" : "outlined"
                        }
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

              {/* Eliminar cita — ahora abre el modal inteligente */}
              {can(["ADMIN"]) && showDeleteButton && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<DeleteOutlineIcon />}
                  onClick={handleDeleteClick}
                  disabled={saving}
                >
                  {selected.status === "cancelado"
                    ? "Eliminar cita cancelada"
                    : "Eliminar cita"}
                </Button>
              )}
            </>
          )}
        </Box>
      </Drawer>

      {/* Modal de cancelación con notas */}
      <CancelDialog
        open={cancelDialogOpen}
        onClose={handleCancelDialogClose}
        onConfirm={handleCancelConfirm}
        preview={cancelPreview}
        saving={saving}
      />
    </>
  );
}
