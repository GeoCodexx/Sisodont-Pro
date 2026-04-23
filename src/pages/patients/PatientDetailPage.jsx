import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PatientHistory from "./PatientHistory";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { usePatientStore } from "../../stores/usePatientStore";

const GENDER_LABEL = { M: "Masculino", F: "Femenino", otro: "Otro" };

function InfoRow({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
}

function AntecedentChip({ label, active, color }) {
  return (
    <Chip
      label={label}
      size="small"
      color={active ? color : "default"}
      variant={active ? "filled" : "outlined"}
      sx={{ opacity: active ? 1 : 0.4 }}
    />
  );
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selected, loading, error, fetchPatientById } = usePatientStore();

  useEffect(() => {
    fetchPatientById(id);
  }, [id]);

  const calcAge = (birth) => {
    if (!birth) return "—";
    const diff = Date.now() - new Date(birth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + " años";
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!selected) return null;

  const p = selected;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/patients")}
          size="small"
        >
          Volver
        </Button>
        <Typography variant="h6" fontWeight={500}>
          {p.full_name}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Datos personales */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={500} mb={2}>
                Datos personales
              </Typography>
              <Grid container>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="DNI" value={p.dni} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="Género" value={GENDER_LABEL[p.gender]} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="Edad" value={calcAge(p.birth_date)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow
                    label="Nacimiento"
                    value={
                      p.birth_date
                        ? new Date(p.birth_date).toLocaleDateString("es-PE")
                        : null
                    }
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="Teléfono" value={p.phone} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="Correo" value={p.email} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <InfoRow label="Dirección" value={p.address} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Antecedentes clínicos */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={500} mb={2}>
                Antecedentes clínicos
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <AntecedentChip
                  label="Diabetes"
                  active={p.diabetes}
                  color="warning"
                />
                <AntecedentChip
                  label="Hipertensión"
                  active={p.hypertension}
                  color="error"
                />
                <AntecedentChip
                  label="Gestante"
                  active={p.pregnancy}
                  color="info"
                />
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <InfoRow label="Alergias" value={p.allergies} />
              <InfoRow label="Medicamentos actuales" value={p.medications} />
              <InfoRow label="Diagnóstico" value={p.diagnosis} />
              <InfoRow label="Observaciones" value={p.observations} />
            </CardContent>
          </Card>
        </Grid>

        {/* Historial — placeholder hasta Fase 4 */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={500} mb={1}>
                Historial de citas
              </Typography>
              <PatientHistory patientId={p.id} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
