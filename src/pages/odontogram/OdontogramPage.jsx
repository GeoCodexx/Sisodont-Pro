import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
  TextField,
  Chip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import WarningIcon from "@mui/icons-material/Warning";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PersonIcon from "@mui/icons-material/Person";

import { useOdontogramStore } from "../../stores/useOdontogramStore";
import { usePatientStore } from "../../stores/usePatientStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRole } from "../../hooks/useRole";
import { supabase } from "../../services/supabaseClient";
import OdontogramCanvas from "./OdontogramCanvas";
import ToothDetailModal from "./ToothDetailModal";

function ActionsLegend({ actions }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {actions.map((a) => (
        <Box
          key={a.name}
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: a.color,
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" color="textSecondary">
            {a.name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ── Chip de tipo — visible cuando ya hay odontograma guardado ─
function OdontogramTypeChip({ type }) {
  return (
    <Chip
      icon={type === "child" ? <ChildCareIcon /> : <PersonIcon />}
      label={type === "child" ? "Odontograma infantil" : "Odontograma adulto"}
      color={type === "child" ? "info" : "default"}
      size="small"
      variant="outlined"
    />
  );
}

export default function OdontogramPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { can } = useRole();
  const { patients, fetchPatients } = usePatientStore();
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);
  const isPatient = role === "PATIENT";

  const {
    data,
    actions,
    loading,
    saving,
    dirty,
    error,
    odontogramType,
    isNew,
    fetchOdontogram,
    fetchActions,
    setOdontogramType,
    saveOdontogram,
    selectTooth,
    selectedTooth,
    reset,
  } = useOdontogramStore();

  const [patient, setPatient] = useState(null);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTooth, setActiveTooth] = useState(null);

  const readOnly = !can(["ADMIN", "DOCTOR"]);

  useEffect(() => {
    fetchActions();

    if (isPatient && profile?.id) {
      // El paciente ve su propio odontograma directamente
      supabase
        .from("patients")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle()
        .then(({ data: patientData }) => {
          if (patientData) {
            setPatient(patientData);
            fetchOdontogram(patientData.id);
          }
        });
    } else {
      fetchPatients({ page: 1, pageSize: 200 });
    }

    return () => reset();
  }, []);

  const handlePatientChange = (_, value) => {
    setPatient(value);
    setFeedback({ msg: "", type: "success" });
    setModalOpen(false);
    if (value) fetchOdontogram(value.id);
    else reset();
  };

  const handleToothClick = (toothNumber) => {
    selectTooth(toothNumber);
    setActiveTooth(toothNumber);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!patient) return;
    const { error } = await saveOdontogram(patient.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else
      setFeedback({
        msg: "Odontograma guardado correctamente.",
        type: "success",
      });
  };

  // ── Indicador de tipo ─────────────────────────────────────
  // isNew=true  → mostrar toggle (odontograma nuevo)
  // isNew=false → mostrar chip (tipo ya fijo)
  const typeIndicator =
    data &&
    (isNew ? (
      <ToggleButtonGroup
        value={odontogramType}
        exclusive
        onChange={(_, val) => {
          if (val) setOdontogramType(val);
        }}
        size="small"
      >
        <ToggleButton value="adult" sx={{ gap: 0.75, px: 1.5 }}>
          <PersonIcon fontSize="small" />
          <Typography
            variant="caption"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Adulto
          </Typography>
        </ToggleButton>
        <ToggleButton value="child" sx={{ gap: 0.75, px: 1.5 }}>
          <ChildCareIcon fontSize="small" />
          <Typography
            variant="caption"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Niño
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    ) : (
      <OdontogramTypeChip type={odontogramType} />
    ));

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Odontograma Digital
          </Typography>
          {dirty && (
            <Chip
              icon={<WarningIcon />}
              label="Sin guardar"
              color="warning"
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        {!readOnly && patient && (
          <Button
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSave}
            disabled={saving || !dirty}
            size={isMobile ? "small" : "medium"}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        )}
      </Box>

      {/* Selector de paciente + indicador de tipo */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2.5,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
        }}
      >
        {/* Selector solo para staff — el paciente ve su odontograma directo */}
        {!isPatient && (
          <Autocomplete
            options={patients}
            getOptionLabel={(p) =>
              `${p.full_name}${p.dni ? " — " + p.dni : ""}`
            }
            value={patient}
            onChange={handlePatientChange}
            sx={{ flex: 1, maxWidth: { sm: 400 } }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar paciente"
                size="small"
              />
            )}
          />
        )}

        {/* Toggle (nuevo) o Chip (existente) */}
        {typeIndicator}
      </Box>

      {/* Feedback y errores */}
      {feedback.msg && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 2 }}
          onClose={() => setFeedback({ msg: "", type: "success" })}
        >
          {feedback.msg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Estado vacío — solo para staff sin paciente seleccionado */}
      {!isPatient && !patient && (
        <Paper
          variant="outlined"
          sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}
        >
          <Typography color="textSecondary">
            Selecciona un paciente para ver o editar su odontograma.
          </Typography>
        </Paper>
      )}

      {/* Cargando */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Canvas */}
      {patient && data && !loading && (
        <Paper
          variant="outlined"
          sx={{ p: { xs: 1, sm: 2 }, overflow: "auto" }}
        >
          {/* {readOnly && (
            <Alert severity="info" sx={{ mb: 2 }} icon={false}>
              Modo solo lectura — solo ADMIN y DOCTOR pueden editar el
              odontograma.
            </Alert>
          )} */}

          {/* Mensaje orientativo para nuevos odontogramas */}
          {isNew && !dirty && (
            <Alert severity="info" sx={{ mb: 2 }} icon={false}>
              Selecciona el tipo de odontograma <strong>(Adulto / Niño)</strong>{" "}
              antes de comenzar. Una vez guardado, el tipo quedará fijo para
              este paciente.
            </Alert>
          )}

          <OdontogramCanvas
            odontogramType={odontogramType}
            onToothClick={!readOnly ? handleToothClick : undefined}
          />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ px: 1 }}>
            <Typography
              variant="caption"
              sx={{
                mb: 1,
                color: "text.secondary",
                fontWeight: 500,
                display: "block",
              }}
            >
              LEYENDA DE ACCIONES
            </Typography>
            <ActionsLegend actions={actions} />
          </Box>
        </Paper>
      )}

      {/* Sin registro de paciente vinculado (PATIENT sin patients.user_id) */}
      {isPatient && !loading && !patient && (
        <Paper
          variant="outlined"
          sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}
        >
          <Typography color="textSecondary">
            Tu ficha clínica aún no está vinculada. Contacta al administrador.
          </Typography>
        </Paper>
      )}

      {/* Modal de detalle del diente */}
      {patient && (
        <ToothDetailModal
          open={modalOpen}
          toothNumber={activeTooth}
          onClose={() => setModalOpen(false)}
          readOnly={readOnly}
        />
      )}
    </Box>
  );
}
