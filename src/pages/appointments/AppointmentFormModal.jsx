import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  InputAdornment,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Box,
  Typography,
  Divider,
  Paper,
  IconButton,
  Collapse,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import { useAppointmentStore } from "../../stores/useAppointmentStore";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { usePatientStore } from "../../stores/usePatientStore";
import { useTreatmentCaseStore } from "../../stores/useTreatmentCaseStore";

const toDatetimeLocal = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

const EMPTY = {
  patient_id: "",
  doctor_id: "",
  treatment_id: "",
  date: "",
  notes: "",
  total: "",
};

// ─────────────────────────────────────────────────────────────
// QuickPatientForm — memo: no re-renderiza por cambios del padre
// que no afectan sus props (saving, onCreated, onCancel).
// ─────────────────────────────────────────────────────────────
const QuickPatientForm = memo(function QuickPatientForm({
  onCreated,
  onCancel,
  saving,
}) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");

  // useMemo: recalcula payload solo cuando cambian first/last
  const payload = useMemo(
    () => ({
      first_name: first.trim(),
      last_name: last.trim(),
      mother_last_name: "",
      full_name: `${first.trim()} ${last.trim()}`.trim(),
    }),
    [first, last],
  );

  const valid = payload.first_name.length > 0 && payload.last_name.length > 0;

  // useCallback: referencia estable para el botón
  const handleCreate = useCallback(
    () => onCreated(payload),
    [onCreated, payload],
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mt: 1,
        borderColor: "primary.main",
        borderWidth: 1.5,
        borderRadius: 2,
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonAddIcon fontSize="small" color="primary" />
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: "primary.main" }}
          >
            Nuevo paciente rápido
          </Typography>
        </Box>
        <IconButton size="small" onClick={onCancel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Nombre(s) *"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            size="small"
            fullWidth
            autoFocus
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Apellidos *"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={
              saving ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
            onClick={handleCreate}
            disabled={!valid || saving}
            fullWidth
          >
            {saving ? "Creando..." : `Crear "${payload.full_name}"`}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
});

// ─────────────────────────────────────────────────────────────
// MultisessionSection — memo: solo re-renderiza si cambia alguna
// de sus props. Aísla el bloque de multisesión del resto del form.
// ─────────────────────────────────────────────────────────────
const MultisessionSection = memo(function MultisessionSection({
  openCase,
  caseOption,
  setCaseOption,
  onCaseOptionChange,
  caseNotes,
  setCaseNotes,
  totalSessions,
  setTotalSessions,
  totalCost,
  setTotalCost,
}) {
  const handleRadioChange = useCallback(
    (e) => {
      setCaseOption(e.target.value);
      onCaseOptionChange?.(e.target.value);
    },
    [setCaseOption, onCaseOptionChange],
  );

  return (
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
        Tratamiento multisesión
      </Typography>

      {openCase ? (
        <>
          <FormLabel sx={{ fontSize: 13 }}>¿Esta cita pertenece a:</FormLabel>
          <RadioGroup
            value={caseOption}
            onChange={handleRadioChange}
            row
            sx={{ mt: 0.5, mb: 1 }}
          >
            <FormControlLabel
              value="existing"
              control={<Radio size="small" />}
              label={<Typography variant="body2">Caso en curso</Typography>}
            />
            <FormControlLabel
              value="new"
              control={<Radio size="small" />}
              label={<Typography variant="body2">Nuevo caso</Typography>}
            />
          </RadioGroup>
        </>
      ) : (
        <Alert
          severity="success"
          icon={<CreateNewFolderIcon fontSize="small" />}
          sx={{ mb: 1.5, py: 0.5 }}
        >
          <Typography variant="caption">
            Se creará un nuevo caso de tratamiento para este paciente.
          </Typography>
        </Alert>
      )}

      {(!openCase || caseOption === "new") && (
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Costo total pactado *"
              type="number"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              size="small"
              fullWidth
              helperText="Monto total acordado con el paciente"
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
              label="N.° sesiones planificadas"
              type="number"
              value={totalSessions}
              onChange={(e) => setTotalSessions(e.target.value)}
              size="small"
              fullWidth
              helperText="Opcional"
              slotProps={{ htmlInput: { min: 1 } }}
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
              placeholder="Plan de tratamiento, observaciones generales..."
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// ObturacionSection — memo: solo re-renderiza si cambian
// teethCount, unitPrice o el callback onTotalChange.
// ─────────────────────────────────────────────────────────────
const ObturacionSection = memo(function ObturacionSection({
  teethCount,
  setTeethCount,
  unitPrice,
  setUnitPrice,
  onTotalChange,
}) {
  // useMemo: no recalcula si los valores no cambian
  const total = useMemo(
    () => (parseFloat(unitPrice) || 0) * (parseInt(teethCount) || 0),
    [unitPrice, teethCount],
  );

  useEffect(() => {
    onTotalChange(total > 0 ? total : "");
  }, [total, onTotalChange]);

  return (
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
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Cantidad *"
            type="number"
            value={teethCount}
            onChange={(e) => setTeethCount(e.target.value)}
            size="small"
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { min: 1, max: 32 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Precio por diente *"
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
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
        <Grid size={{ xs: 12, sm: 4 }}>
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
              S/ {total.toFixed(2)}
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
  );
});

// ─────────────────────────────────────────────────────────────
// AppointmentFormModal — componente principal
// ─────────────────────────────────────────────────────────────
export default function AppointmentFormModal({ open, prefillDate, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { createAppointment, saving, checkOverlap } = useAppointmentStore();
  const { doctors, treatments, fetchAll } = useCatalogStore();
  const { patients, fetchPatients, createQuickPatient } = usePatientStore();
  const { findOpenCase, createCase } = useTreatmentCaseStore();

  //const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");

  const [openCase, setOpenCase] = useState(null);
  const [caseOption, setCaseOption] = useState("existing");
  const [caseNotes, setCaseNotes] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [checkingCase, setCheckingCase] = useState(false);

  const [teethCount, setTeethCount] = useState("");
  const [unitPrice, setUnitPrice] = useState("50");
  const [calcTotal, setCalcTotal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: EMPTY,
  });

  // Watch solo los campos que afectan lógica condicional
  const watchTreatmentId = watch("treatment_id");
  const watchPatientId = watch("patient_id");
  const watchDoctorId = watch("doctor_id");
  const watchTotal = watch("total");
  const watchDate = watch("date");
  const watchNotes = watch("notes");

  // useMemo: derivados del tratamiento seleccionado
  const selectedTreatment = useMemo(
    () => treatments.find((t) => t.id === watchTreatmentId) ?? null,
    [treatments, watchTreatmentId],
  );

  const isMultisession = selectedTreatment?.is_multisession === true;

  const isObturacion = useMemo(
    () =>
      !!selectedTreatment?.unit_price &&
      selectedTreatment?.name?.toUpperCase().includes("OBTURACIÓN"),
    [selectedTreatment],
  );

  // isUnitPrice: tratamientos por unidad que NO son obturación
  const isUnitPrice = useMemo(
    () => !!selectedTreatment?.unit_price && !isObturacion,
    [selectedTreatment, isObturacion],
  );

  const showTotalField = !isObturacion && !isMultisession && !isUnitPrice;

  //const showTotalField = !isObturacion && !isMultisession;

  // useMemo: filtra doctores por especialidad
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
    if (!open) return;
    fetchAll();
    fetchPatients({ page: 1, pageSize: 200 });

    const firstDoctor = doctors[0]?.id ?? "";

    reset({
      ...EMPTY,
      doctor_id: firstDoctor,
      date: prefillDate ? toDatetimeLocal(prefillDate) : "",
    });

    setSelectedPatient(null);
    setShowQuickForm(false);
    setOpenCase(null);
    setCaseOption("existing");
    setCaseNotes("");
    setTotalSessions("");
    setTotalCost("");
    setTeethCount("");
    setUnitPrice("50");
    setCalcTotal("");
    setError("");
    setQuickError("");
    setIsSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open || watchDoctorId) return; // ya tiene doctor seleccionado
    if (doctors.length > 0) setValue("doctor_id", doctors[0].id);
  }, [doctors, open]);

  // ── Efecto 1: lógica de obturación (unit_price) ──────────────
  useEffect(() => {
    if (!selectedTreatment || !isObturacion) return;
    setTeethCount("");
    setCalcTotal("");
    setValue("total", "");
    if (selectedTreatment.unit_price)
      setUnitPrice(String(selectedTreatment.unit_price));
  }, [watchTreatmentId, isObturacion]);

  // ── Efecto 2: lógica de sesión única — autoprecio ─────────────
  useEffect(() => {
    if (!selectedTreatment || isObturacion || isMultisession || isUnitPrice)
      return;
    // Sesión única: autorellena el total con effective_price
    setValue("total", String(selectedTreatment.effective_price ?? ""));
  }, [watchTreatmentId, isObturacion, isMultisession, isUnitPrice]);

  // ── Efecto 3: lógica multisesión — verificar caso abierto ─────
  useEffect(() => {
    if (!selectedTreatment || !isMultisession) return;
    if (!watchPatientId) {
      setOpenCase(null);
      setTotalCost(String(selectedTreatment.effective_price ?? ""));
      setValue("total", "0");
      return;
    }
    setCheckingCase(true);
    findOpenCase(watchPatientId, watchTreatmentId).then((found) => {
      setOpenCase(found);
      setCaseOption(found ? "existing" : "new");
      setCheckingCase(false);
      if (!found) setTotalCost(String(selectedTreatment.effective_price ?? ""));
      setValue("total", "0");
    });
  }, [watchPatientId, watchTreatmentId, isMultisession]);

  const handleQuickCancel = useCallback(() => setShowQuickForm(false), []);
  const handleShowQuickForm = useCallback(() => setShowQuickForm(true), []);

  const handlePatientChange = useCallback(
    (_, val) => {
      setSelectedPatient(val);
      setValue("patient_id", val?.id ?? "");
      if (val) setShowQuickForm(false);
    },
    [setValue],
  );

  const handleQuickCreate = useCallback(
    async (patientData) => {
      setQuickSaving(true);
      setQuickError("");
      const { data, error } = await createQuickPatient(patientData);
      setQuickSaving(false);
      if (error) {
        setQuickError(error);
        return;
      }
      await fetchPatients({ page: 1, pageSize: 200 });
      setSelectedPatient(data);
      setValue("patient_id", data.id);
      setShowQuickForm(false);
    },
    [createQuickPatient, fetchPatients, setValue],
  );

  const handleTotalChange = useCallback(
    (val) => {
      setCalcTotal(val);
      setValue("total", val);
    },
    [setValue],
  );

  const handleCaseOptionChange = useCallback(
    (val) => {
      if (val === "existing") setValue("total", "0");
      else {
        setTotalCost(String(selectedTreatment?.effective_price ?? ""));
        setValue("total", "0");
      }
    },
    [selectedTreatment, setValue],
  );

  /*const onSubmit = useCallback(
    async (data) => {
      setError("");

      if (!data.patient_id) {
        setError("Selecciona o crea un paciente.");
        return;
      }
      if (!data.doctor_id) {
        setError("Selecciona un doctor.");
        return;
      }
      if (!data.date) {
        setError("Ingresa la fecha y hora.");
        return;
      }
      if (isObturacion && (!teethCount || parseInt(teethCount) < 1)) {
        setError("Ingresa la cantidad de dientes a curar.");
        return;
      }
      if (isMultisession && (!openCase || caseOption === "new") && !totalCost) {
        setError("Ingresa el costo total pactado del tratamiento.");
        return;
      }

      const startDate = new Date(data.date);
      const endDate = new Date(
        startDate.getTime() + (selectedTreatment?.duration_min ?? 30) * 60000,
      );
      const total = isObturacion
        ? (parseFloat(unitPrice) || 0) * (parseInt(teethCount) || 0)
        : parseFloat(data.total) || 0;

      let caseId = null;
      if (isMultisession) {
        if (openCase && caseOption === "existing") {
          caseId = openCase.id;
        } else {
          const { data: newCase, error: caseError } = await createCase({
            patient_id: data.patient_id,
            treatment_id: data.treatment_id,
            doctor_id: data.doctor_id,
            notes: caseNotes || null,
            total_sessions: totalSessions ? parseInt(totalSessions) : null,
            total_cost: totalCost ? parseFloat(totalCost) : null,
          });
          if (caseError) {
            setError("Error al crear el caso: " + caseError);
            return;
          }
          caseId = newCase.id;
        }
      }

      // Validar solapamiento
      const { overlap, error: overlapError } = await checkOverlap(
        data.doctor_id,
        startDate.toISOString(),
        endDate.toISOString(),
      );
      if (overlapError) {
        setError("Error al verificar disponibilidad.");
        return;
      }
      if (overlap) {
        setError(
          "El doctor ya tiene una cita en ese horario. Elige otra hora.",
        );
        return;
      }

      const { error: apptError } = await createAppointment({
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        treatment_id: data.treatment_id || null,
        date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        total,
        notes: data.notes || null,
        case_id: caseId,
        teeth_count: isObturacion ? parseInt(teethCount) : null,
        unit_price: isObturacion ? parseFloat(unitPrice) : null,
      });

      if (apptError) {
        setError(apptError);
        return;
      }
      onClose(true);
    },
    [
      isObturacion,
      isMultisession,
      teethCount,
      unitPrice,
      totalCost,
      openCase,
      caseOption,
      caseNotes,
      totalSessions,
      selectedTreatment,
      createCase,
      createAppointment,
      onClose,
    ],
  );*/
  const onSubmit = useCallback(
    async (data) => {
      setError("");
      setIsSubmitting(true);

      try {
        if (!data.patient_id) {
          setError("Selecciona o crea un paciente.");
          return;
        }
        if (!data.doctor_id) {
          setError("Selecciona un doctor.");
          return;
        }
        if (!data.date) {
          setError("Ingresa la fecha y hora.");
          return;
        }
        if (isObturacion && (!teethCount || parseInt(teethCount) < 1)) {
          setError("Ingresa la cantidad de dientes a curar.");
          return;
        }
        if (
          isMultisession &&
          (!openCase || caseOption === "new") &&
          !totalCost
        ) {
          setError("Ingresa el costo total pactado del tratamiento.");
          return;
        }

        const startDate = new Date(data.date);
        const endDate = new Date(
          startDate.getTime() + (selectedTreatment?.duration_min ?? 30) * 60000,
        );
        const total = isObturacion
          ? (parseFloat(unitPrice) || 0) * (parseInt(teethCount) || 0)
          : parseFloat(data.total) || 0;

        let caseId = null;
        if (isMultisession) {
          if (openCase && caseOption === "existing") {
            caseId = openCase.id;
          } else {
            const { data: newCase, error: caseError } = await createCase({
              patient_id: data.patient_id,
              treatment_id: data.treatment_id,
              doctor_id: data.doctor_id,
              notes: caseNotes || null,
              total_sessions: totalSessions ? parseInt(totalSessions) : null,
              total_cost: totalCost ? parseFloat(totalCost) : null,
            });
            if (caseError) {
              setError("Error al crear el caso: " + caseError);
              return;
            }
            caseId = newCase.id;
          }
        }

        // Validar solapamiento
        const { overlap, error: overlapError } = await checkOverlap(
          data.doctor_id,
          startDate.toISOString(),
          endDate.toISOString(),
        );
        if (overlapError) {
          setError("Error al verificar disponibilidad.");
          return;
        }
        if (overlap) {
          setError(
            "El doctor ya tiene una cita en ese horario. Elige otra hora.",
          );
          return;
        }

        const { error: apptError } = await createAppointment({
          patient_id: data.patient_id,
          doctor_id: data.doctor_id,
          treatment_id: data.treatment_id || null,
          date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total,
          notes: data.notes || null,
          case_id: caseId,
          teeth_count: isObturacion ? parseInt(teethCount) : null,
          unit_price: isObturacion ? parseFloat(unitPrice) : null,
        });

        if (apptError) {
          setError(apptError);
          return;
        }
        onClose(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isObturacion,
      isMultisession,
      teethCount,
      unitPrice,
      totalCost,
      openCase,
      caseOption,
      caseNotes,
      totalSessions,
      selectedTreatment,
      createCase,
      createAppointment,
      onClose,
    ],
  );
  // useMemo: opciones de Autocomplete no cambian si patients no cambia
  const autocompleteGetLabel = useCallback(
    (p) => `${p.full_name}${p.dni ? " — " + p.dni : ""}`,
    [],
  );

  const noOptionsText = useMemo(
    () => (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          py: 0.5,
        }}
        onClick={handleShowQuickForm}
      >
        <PersonAddIcon fontSize="small" color="primary" />
        <Typography
          variant="body2"
          sx={{ color: "primary.main", fontWeight: 500 }}
        >
          Crear paciente rápido
        </Typography>
      </Box>
    ),
    [handleShowQuickForm],
  );

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>Nueva cita</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Paciente */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={patients}
              getOptionLabel={autocompleteGetLabel}
              value={selectedPatient}
              onChange={handlePatientChange}
              noOptionsText={noOptionsText}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Paciente *"
                  size="small"
                  helperText={
                    selectedPatient
                      ? ""
                      : "Escribe para buscar o crea uno nuevo"
                  }
                />
              )}
            />
            {!selectedPatient && !showQuickForm && (
              <Button
                size="small"
                startIcon={<PersonAddIcon fontSize="small" />}
                onClick={handleShowQuickForm}
                sx={{ mt: 0.75, fontSize: 12 }}
              >
                ¿Paciente nuevo? Créalo aquí
              </Button>
            )}
            <Collapse in={showQuickForm} unmountOnExit>
              {quickError && (
                <Alert
                  severity="error"
                  sx={{ mt: 1 }}
                  onClose={() => setQuickError("")}
                >
                  {quickError}
                </Alert>
              )}
              <QuickPatientForm
                onCreated={handleQuickCreate}
                onCancel={handleQuickCancel}
                saving={quickSaving}
              />
            </Collapse>
          </Grid>

          {/* Tratamiento */}
          <Grid size={{ xs: 12 }}>
            {/* <TextField
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
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {t.name}
                      </Typography>
                    </Box>
                    {t.is_multisession && (
                      <Chip
                        label="Multisesión"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: 10, height: 18, flexShrink: 0 }}
                      />
                    )}
                    {!t.is_multisession && !t.unit_price && (
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
                        S/ {Number(t.effective_price).toFixed(2)}/d
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </TextField> */}
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
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {t.name}
                          </Typography>
                        </Box>
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
          <Grid size={{ xs: 12, sm: 6 }}>
            {/* <TextField
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
            </TextField> */}
            <Controller
              name="doctor_id"
              control={control}
              rules={{ required: "Selecciona un doctor." }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label="Doctor *"
                  size="small"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
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

          {/* Obturación */}
          {isObturacion && (
            <Grid size={{ xs: 12 }}>
              <ObturacionSection
                teethCount={teethCount}
                setTeethCount={setTeethCount}
                unitPrice={unitPrice}
                setUnitPrice={setUnitPrice}
                onTotalChange={handleTotalChange}
              />
            </Grid>
          )}

          {/* Multisesión */}
          {isMultisession && watchPatientId && (
            <Grid size={{ xs: 12 }}>
              {checkingCase ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Verificando casos en curso...
                  </Typography>
                </Box>
              ) : (
                <MultisessionSection
                  openCase={openCase}
                  caseOption={caseOption}
                  setCaseOption={setCaseOption}
                  onCaseOptionChange={handleCaseOptionChange}
                  caseNotes={caseNotes}
                  setCaseNotes={setCaseNotes}
                  totalSessions={totalSessions}
                  setTotalSessions={setTotalSessions}
                  totalCost={totalCost}
                  setTotalCost={setTotalCost}
                />
              )}
            </Grid>
          )}

          {/* Fecha */}
          <Grid size={{ xs: 12, sm: showTotalField ? 6 : 12 }}>
            <Controller
              name="date"
              control={control}
              rules={{ required: "Ingresa la fecha y hora." }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Fecha y hora *"
                  type="datetime-local"
                  size="small"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>

          {/* Total sesión */}
          {showTotalField && (
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
                      htmlInput: { min: 0, step: "0.01" },
                    }}
                  />
                )}
              />
            </Grid>
          )}

          {/* Total calculado obturación */}
          {isObturacion && watchTotal && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Total (calculado)"
                value={`S/ ${Number(watchTotal).toFixed(2)}`}
                size="small"
                fullWidth
                disabled
                helperText="Calculado automáticamente"
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
                  label="Notas de esta sesión"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Observaciones específicas de esta cita..."
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => onClose(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={rhfHandleSubmit(onSubmit)}
          disabled={isSubmitting || saving || quickSaving || checkingCase}
        >
          {isSubmitting || saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Crear cita"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
