import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Grid, Card, CardContent,
  Chip, CircularProgress, Alert, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField,
} from "@mui/material";
import ArrowBackIcon    from "@mui/icons-material/ArrowBack";
import LinkIcon         from "@mui/icons-material/Link";
import LinkOffIcon      from "@mui/icons-material/LinkOff";
import LockOpenIcon     from "@mui/icons-material/LockOpen";
import { usePatientStore } from "../../stores/usePatientStore";
import { useAuthStore }    from "../../stores/useAuthStore";
import PatientHistory      from "./PatientHistory";
import TreatmentCasesPanel from "./TreatmentCasesPanel";

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

function calcAge(birth) {
  if (!birth) return "—";
  return (
    Math.floor((Date.now() - new Date(birth)) / (1000 * 60 * 60 * 24 * 365.25)) +
    " años"
  );
}

// ─────────────────────────────────────────────────────────────
// PortalAccessCard
// Permite al ADMIN activar o desactivar el acceso al portal
// del paciente. Solo visible para roles ADMIN.
// ─────────────────────────────────────────────────────────────
function PortalAccessCard({ patient }) {
  const { activatePortalAccess, deactivatePortalAccess, saving } =
    usePatientStore();
  const role = useAuthStore((s) => s.role);

  const [openActivate, setOpenActivate] = useState(false);
  const [form,         setForm]         = useState({ email: "", password: "" });
  const [feedback,     setFeedback]     = useState({ msg: "", type: "success" });

  // Solo ADMIN puede gestionar el portal
  if (role !== "ADMIN") return null;

  const hasPortal = !!patient.user_id;

  const setField = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleActivate = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      setFeedback({ msg: "Correo y contraseña son requeridos.", type: "error" });
      return;
    }
    const { error } = await activatePortalAccess({
      patientId: patient.id,
      email:     form.email.trim(),
      password:  form.password,
    });
    if (error) {
      setFeedback({ msg: error, type: "error" });
      return;
    }
    setFeedback({ msg: "Acceso al portal activado.", type: "success" });
    setOpenActivate(false);
    setForm({ email: "", password: "" });
  };

  const handleDeactivate = async () => {
    if (!window.confirm("¿Desactivar el acceso al portal de este paciente?")) return;
    const { error } = await deactivatePortalAccess(patient.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else       setFeedback({ msg: "Acceso al portal desactivado.", type: "success" });
  };

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <LockOpenIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={600}>
              Acceso al portal
            </Typography>
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

          {hasPortal ? (
            <Box>
              <Chip
                label="Portal activo"
                color="success"
                size="small"
                icon={<LinkIcon />}
                sx={{ mb: 1.5 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                El paciente puede iniciar sesión y consultar sus citas.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<LinkOffIcon />}
                onClick={handleDeactivate}
                disabled={saving}
              >
                Desactivar acceso
              </Button>
            </Box>
          ) : (
            <Box>
              <Chip
                label="Sin acceso al portal"
                size="small"
                variant="outlined"
                sx={{ mb: 1.5 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                El paciente no tiene cuenta. Activa el portal para que pueda
                ver sus citas en línea.
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<LinkIcon />}
                onClick={() => setOpenActivate(true)}
              >
                Activar acceso al portal
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal — activar portal */}
      <Dialog
        open={openActivate}
        onClose={() => setOpenActivate(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Activar portal — {patient.full_name}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {feedback.msg && feedback.type === "error" && (
            <Alert severity="error">{feedback.msg}</Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            Crea las credenciales de acceso para el paciente. Estas se usarán
            para iniciar sesión en el portal.
          </Typography>
          <TextField
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={setField("email")}
            size="small"
            fullWidth
          />
          <TextField
            label="Contraseña temporal"
            type="password"
            value={form.password}
            onChange={setField("password")}
            size="small"
            fullWidth
            helperText="El paciente podrá cambiarla luego desde su perfil."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenActivate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleActivate} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Activar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PatientDetailPage
// ─────────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { selected, loading, error, fetchPatientById } = usePatientStore();

  useEffect(() => { fetchPatientById(id); }, [id]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (error)    return <Alert severity="error">{error}</Alert>;
  if (!selected) return null;

  const p = selected;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/patients")}
          size="small"
        >
          Volver
        </Button>
        <Typography variant="h6">{p.full_name}</Typography>
      </Box>

      <Grid container spacing={2}>

        {/* Datos personales */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Datos personales
              </Typography>
              <Grid container>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="DNI"       value={p.dni} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="Género"    value={GENDER_LABEL[p.gender]} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="Edad"      value={calcAge(p.birth_date)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow
                    label="Nacimiento"
                    value={p.birth_date
                      ? new Date(p.birth_date).toLocaleDateString("es-PE")
                      : null}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="Teléfono" value={p.phone} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <InfoRow label="Correo"   value={p.email} />
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
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Antecedentes clínicos
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <AntecedentChip label="Diabetes"     active={p.diabetes}     color="warning" />
                <AntecedentChip label="Hipertensión" active={p.hypertension} color="error"   />
                <AntecedentChip label="Gestante"     active={p.pregnancy}    color="info"    />
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <InfoRow label="Alergias"              value={p.allergies}    />
              <InfoRow label="Medicamentos actuales" value={p.medications}  />
              <InfoRow label="Diagnóstico"           value={p.diagnosis}    />
              <InfoRow label="Observaciones"         value={p.observations} />
            </CardContent>
          </Card>
        </Grid>

        {/* Acceso al portal — solo visible para ADMIN */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PortalAccessCard patient={p} />
        </Grid>

        {/* Tratamientos */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Tratamientos realizados
              </Typography>
              <TreatmentCasesPanel patientId={p.id} />
            </CardContent>
          </Card>
        </Grid>

        {/* Historial de citas */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
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