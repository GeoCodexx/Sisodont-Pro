import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Alert, CircularProgress,
  Autocomplete, TextField, Chip, Paper,
  ToggleButton, ToggleButtonGroup, Tooltip,
  useTheme, useMediaQuery, Divider,
} from "@mui/material";
import SaveIcon      from "@mui/icons-material/Save";
import WarningIcon   from "@mui/icons-material/Warning";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PersonIcon    from "@mui/icons-material/Person";

import { useOdontogramStore } from "../../stores/useOdontogramStore";
import { usePatientStore }    from "../../stores/usePatientStore";
import { useRole }            from "../../hooks/useRole";
import OdontogramCanvas       from "./OdontogramCanvas";
import ToothDetailModal       from "./ToothDetailModal";

// ─────────────────────────────────────────────────────────────
// Nota: useAuthStore ya NO se importa aquí.
// updated_by lo resuelve saveOdontogram internamente.
// ─────────────────────────────────────────────────────────────

function ActionsLegend({ actions }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {actions.map((a) => (
        <Box key={a.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: a.color, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary">{a.name}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function OdontogramPage() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { can }                            = useRole();
  const { patients, fetchPatients }        = usePatientStore();
  const {
    data, actions, loading, saving, dirty, error,
    odontogramType,
    fetchOdontogram, fetchActions,
    setOdontogramType, saveOdontogram,
    selectTooth, selectedTooth, reset,
  } = useOdontogramStore();

  const [patient,    setPatient]    = useState(null);
  const [feedback,   setFeedback]   = useState({ msg: "", type: "success" });
  const [modalOpen,  setModalOpen]  = useState(false);
  const [activeTooth, setActiveTooth] = useState(null);

  const readOnly = !can(["ADMIN", "DOCTOR"]);

  useEffect(() => {
    fetchPatients({ page: 1, pageSize: 200 });
    fetchActions();
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

  const handleModalClose = () => setModalOpen(false);

  // updated_by ya no se pasa — el store lo resuelve
  const handleSave = async () => {
    if (!patient) return;
    const { error } = await saveOdontogram(patient.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else       setFeedback({ msg: "Odontograma guardado correctamente.", type: "success" });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6" fontWeight={500}>Odontograma Digital</Typography>
          {dirty && (
            <Chip icon={<WarningIcon />} label="Sin guardar" color="warning" size="small" variant="outlined" />
          )}
        </Box>
        {!readOnly && patient && (
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || !dirty}
            size={isMobile ? "small" : "medium"}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        )}
      </Box>

      {/* Selector de paciente + toggle adulto/niño */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5, flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" } }}>
        <Autocomplete
          options={patients}
          getOptionLabel={(p) => `${p.full_name}${p.dni ? " — " + p.dni : ""}`}
          value={patient}
          onChange={handlePatientChange}
          sx={{ flex: 1, maxWidth: { sm: 400 } }}
          renderInput={(params) => (
            <TextField {...params} label="Seleccionar paciente" size="small" />
          )}
        />

        {patient && data && (
          <ToggleButtonGroup
            value={odontogramType}
            exclusive
            onChange={(_, val) => { if (val) setOdontogramType(val); }}
            size="small"
          >
            <ToggleButton value="adult" sx={{ gap: 0.75, px: 1.5 }}>
              <PersonIcon fontSize="small" />
              <Typography variant="caption" sx={{ display: { xs: "none", sm: "block" } }}>
                Adulto
              </Typography>
            </ToggleButton>
            <ToggleButton value="child" sx={{ gap: 0.75, px: 1.5 }}>
              <ChildCareIcon fontSize="small" />
              <Typography variant="caption" sx={{ display: { xs: "none", sm: "block" } }}>
                Niño
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Feedback */}
      {feedback.msg && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 2 }}
          onClose={() => setFeedback({ msg: "", type: "success" })}
        >
          {feedback.msg}
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Estado vacío */}
      {!patient && (
        <Paper
          variant="outlined"
          sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}
        >
          <Typography color="text.secondary">
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
        <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 }, overflow: "auto" }}>
          {readOnly && (
            <Alert severity="info" sx={{ mb: 2 }} icon={false}>
              Modo solo lectura — solo ADMIN y DOCTOR pueden editar el odontograma.
            </Alert>
          )}

          <OdontogramCanvas
            odontogramType={odontogramType}
            onToothClick={!readOnly ? handleToothClick : undefined}
          />

          <Divider sx={{ my: 2 }} />

          {/* Leyenda */}
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" sx={{ mb: 1 }}>
              LEYENDA DE ACCIONES
            </Typography>
            <ActionsLegend actions={actions} />
          </Box>
        </Paper>
      )}

      {/* Modal de detalle del diente */}
      {patient && (
        <ToothDetailModal
          open={modalOpen}
          toothNumber={activeTooth}
          onClose={handleModalClose}
          readOnly={readOnly}
        />
      )}
    </Box>
  );
}