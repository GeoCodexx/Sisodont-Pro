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
  Paper,
  Drawer,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import WarningIcon from "@mui/icons-material/Warning";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
import { useOdontogramStore } from "../../stores/useOdontogramStore";
import { usePatientStore } from "../../stores/usePatientStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRole } from "../../hooks/useRole";
import OdontogramCanvas from "./OdontogramCanvas";
import OdontogramPanel from "./OdontogramPanel";

export default function OdontogramPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
  const [panelOpen, setPanelOpen] = useState(false);

  const readOnly = !can(["ADMIN", "DOCTOR"]);

  useEffect(() => {
    fetchPatients({ page: 1, pageSize: 200 });
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
    else setFeedback({ msg: "Odontograma guardado.", type: "success" });
  };

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
          <Typography variant="h6" fontWeight={500}>
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

      {/* Selector de paciente */}
      <Box sx={{ mb: 2.5, maxWidth: { sm: 420 } }}>
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
        <>
          {/* ── Desktop: canvas + panel lado a lado ── */}
          {!isMobile && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, xl: 8 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={1.5}
                  >
                    {readOnly
                      ? "Vista de solo lectura"
                      : "Selecciona una acción y haz clic en las caras del diente"}
                  </Typography>
                  <OdontogramCanvas readOnly={readOnly} />
                  <Divider sx={{ mt: 2, mb: 1.5 }} />
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {[
                      ["▲", "Oclusal"],
                      ["▼", "Lingual"],
                      ["◀", "Mesial"],
                      ["▶", "Distal"],
                      ["◆", "Vestibular"],
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
              <Grid size={{ xs: 12, xl: 4 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, position: "sticky", top: 88 }}
                >
                  <OdontogramPanel readOnly={readOnly} />
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* ── Móvil: canvas scrollable + FAB para abrir panel ── */}
          {isMobile && (
            <Box>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  {readOnly
                    ? "Solo lectura"
                    : "Toca una acción en el panel ↘ luego toca una cara del diente"}
                </Typography>
                {/* Canvas scrollable horizontalmente si es necesario */}
                <Box
                  sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
                >
                  <OdontogramCanvas readOnly={readOnly} />
                </Box>
                <Divider sx={{ mt: 1.5, mb: 1 }} />
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {[
                    ["▲", "Oclusal"],
                    ["▼", "Lingual"],
                    ["◀", "Mesial"],
                    ["▶", "Distal"],
                    ["◆", "Vestibular"],
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

              {/* FAB para abrir panel de acciones en móvil */}
              {!readOnly && (
                <Fab
                  color="primary"
                  size="medium"
                  onClick={() => setPanelOpen(true)}
                  sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 1200,
                  }}
                >
                  <TuneIcon />
                </Fab>
              )}

              {/* Drawer bottom sheet del panel */}
              <Drawer
                anchor="bottom"
                open={panelOpen}
                onClose={() => setPanelOpen(false)}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: "16px 16px 0 0",
                      maxHeight: "75vh",
                      display: "flex",
                      flexDirection: "column",
                    },
                  },
                }}
              >
                {/* Handle */}
                <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "divider",
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 2.5,
                    py: 1.5,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={500}>
                    Acciones y diente
                  </Typography>
                  <IconButton size="small" onClick={() => setPanelOpen(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Divider />

                <Box sx={{ overflow: "auto", flex: 1, p: 2.5 }}>
                  <OdontogramPanel readOnly={readOnly} />
                </Box>

                {/* Botón guardar dentro del drawer en móvil */}
                {!readOnly && dirty && (
                  <>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={
                          saving ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        onClick={async () => {
                          await handleSave();
                          setPanelOpen(false);
                        }}
                        disabled={saving}
                      >
                        {saving ? "Guardando..." : "Guardar odontograma"}
                      </Button>
                    </Box>
                  </>
                )}
              </Drawer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
