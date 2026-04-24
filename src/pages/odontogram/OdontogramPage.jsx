import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
  TextField,
  Chip,
  Divider,
  Paper,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import WarningIcon from "@mui/icons-material/Warning";
import { useOdontogramStore } from "../../stores/useOdontogramStore";
import { usePatientStore } from "../../stores/usePatientStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRole } from "../../hooks/useRole";
import OdontogramCanvas from "./OdontogramCanvas";
import OdontogramPanel from "./OdontogramPanel";

export default function OdontogramPage() {
  const { can } = useRole();
  const { profile } = useAuthStore();
  const { patients, fetchPatients } = usePatientStore();
  const {
    data,
    loading,
    saving,
    dirty,
    error,
    fetchOdontogram,
    fetchActions,
    saveOdontogram,
    reset,
  } = useOdontogramStore();

  const [patient, setPatient] = useState(null);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  const readOnly = !can(["ADMIN", "DOCTOR"]);

  useEffect(() => {
    fetchPatients();
    fetchActions();
    return () => reset();
  }, []);

  const handlePatientChange = (_, value) => {
    setPatient(value);
    setFeedback({ msg: "", type: "success" });
    if (value) fetchOdontogram(value.id);
    else reset();
  };

  const handleSave = async () => {
    if (!patient) return;
    const { error } = await saveOdontogram(patient.id, profile?.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else
      setFeedback({
        msg: "Odontograma guardado correctamente.",
        type: "success",
      });
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" fontWeight={500}>
            Odontograma Digital
          </Typography>
          {dirty && (
            <Chip
              icon={<WarningIcon />}
              label="Cambios sin guardar"
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
          >
            {saving ? "Guardando..." : "Guardar odontograma"}
          </Button>
        )}
      </Box>

      {/* Selector de paciente */}
      <Box sx={{ mb: 3, maxWidth: 420 }}>
        <Autocomplete
          options={patients}
          getOptionLabel={(p) => `${p.full_name}${p.dni ? " — " + p.dni : ""}`}
          value={patient}
          onChange={handlePatientChange}
          renderInput={(params) => (
            <TextField {...params} label="Seleccionar paciente" size="small" />
          )}
        />
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!patient && (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography color="text.secondary">
            Selecciona un paciente para ver o editar su odontograma.
          </Typography>
        </Box>
      )}

      {patient && loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {patient && !loading && data && (
        <Grid container spacing={3}>
          {/* Canvas SVG */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={1.5}
              >
                {readOnly
                  ? "Vista de solo lectura — solo doctores pueden editar"
                  : "Selecciona una acción y haz clic en las caras del diente"}
              </Typography>
              <OdontogramCanvas readOnly={readOnly} />

              {/* Leyenda de caras */}
              <Divider sx={{ mt: 2, mb: 1.5 }} />
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {[
                  ["▲", "Oclusal (top)"],
                  ["▼", "Lingual (bottom)"],
                  ["◀", "Mesial (left)"],
                  ["▶", "Distal (right)"],
                  ["◆", "Vestibular (center)"],
                ].map(([icon, label]) => (
                  <Typography
                    key={label}
                    variant="caption"
                    color="text.secondary"
                  >
                    {icon} {label}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Panel de control */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper
              variant="outlined"
              sx={{ p: 2, position: { lg: "sticky" }, top: { lg: 88 } }}
            >
              <OdontogramPanel readOnly={readOnly} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
