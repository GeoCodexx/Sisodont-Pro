import { useEffect, memo, useCallback, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Grid, Card, CardContent,
  Chip, CircularProgress, Alert, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Skeleton,
} from "@mui/material";
import { useState } from "react";
import ArrowBackIcon  from "@mui/icons-material/ArrowBack";
import LinkIcon       from "@mui/icons-material/Link";
import LinkOffIcon    from "@mui/icons-material/LinkOff";
import LockOpenIcon   from "@mui/icons-material/LockOpen";
import { usePatientStore } from "../../stores/usePatientStore";
import { useAuthStore }    from "../../stores/useAuthStore";

// ─────────────────────────────────────────────────────────────
// Lazy — TreatmentCasesPanel y PatientHistory son pesados
// (accordions, supabase queries, sub-stores). Se cargan solo
// cuando el usuario abre la ficha del paciente.
// ─────────────────────────────────────────────────────────────
const PatientHistory      = lazy(() => import("./PatientHistory"));
const TreatmentCasesPanel = lazy(() => import("./TreatmentCasesPanel"));

// Skeleton que mantiene el layout mientras carga el panel
const PanelSkeleton = memo(function PanelSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Skeleton variant="rounded" height={56} animation="wave" />
      <Skeleton variant="rounded" height={56} animation="wave" />
      <Skeleton variant="rounded" height={56} animation="wave" />
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// Constantes fuera del componente
// ─────────────────────────────────────────────────────────────
const GENDER_LABEL = { M: "Masculino", F: "Femenino", otro: "Otro" };

const birthDateFormatter = new Intl.DateTimeFormat("es-PE");

// ─────────────────────────────────────────────────────────────
// Helpers puros — fuera del componente, sin recreación
// ─────────────────────────────────────────────────────────────
function calcAge(birth) {
  if (!birth) return "—";
  return (
    Math.floor((Date.now() - new Date(birth)) / (1000 * 60 * 60 * 24 * 365.25)) +
    " años"
  );
}

// ─────────────────────────────────────────────────────────────
// InfoRow — memo: solo re-renderiza si label o value cambian
// ─────────────────────────────────────────────────────────────
const InfoRow = memo(function InfoRow({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// AntecedentChip — memo: props primitivos, bailout efectivo
// ─────────────────────────────────────────────────────────────
const AntecedentChip = memo(function AntecedentChip({ label, active, color }) {
  return (
    <Chip
      label={label}
      size="small"
      color={active ? color : "default"}
      variant={active ? "filled" : "outlined"}
      sx={{ opacity: active ? 1 : 0.4 }}
    />
  );
});

// ─────────────────────────────────────────────────────────────
// PortalAccessCard — aislado para que sus propios estados
// (openActivate, form, feedback) no provoquen re-renders
// en PatientDetailPage
// ─────────────────────────────────────────────────────────────
const PortalAccessCard = memo(function PortalAccessCard({ patient }) {
  const { activatePortalAccess, deactivatePortalAccess, saving } = usePatientStore();
  // Selector granular — solo re-suscribe si role cambia
  const role = useAuthStore((s) => s.role);

  const [openActivate, setOpenActivate] = useState(false);
  const [form,         setForm]         = useState({ email: "", password: "" });
  const [feedback,     setFeedback]     = useState({ msg: "", type: "success" });

  // Solo ADMIN puede gestionar el portal
  if (role !== "ADMIN") return null;

  const hasPortal = !!patient.user_id;

  // Handler de campo estable — useCallback en lugar de factory inline
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleOpenActivate  = useCallback(() => setOpenActivate(true), []);
  const handleCloseActivate = useCallback(() => setOpenActivate(false), []);
  const clearFeedback       = useCallback(
    () => setFeedback({ msg: "", type: "success" }),
    [],
  );

  const handleActivate = useCallback(async () => {
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
  }, [form, patient.id, activatePortalAccess]);

  const handleDeactivate = useCallback(async () => {
    if (!window.confirm("¿Desactivar el acceso al portal de este paciente?")) return;
    const { error } = await deactivatePortalAccess(patient.id);
    if (error) setFeedback({ msg: error, type: "error" });
    else       setFeedback({ msg: "Acceso al portal desactivado.", type: "success" });
  }, [patient.id, deactivatePortalAccess]);

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
            <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={clearFeedback}>
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
                onClick={handleOpenActivate}
              >
                Activar acceso al portal
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal — activar portal */}
      <Dialog open={openActivate} onClose={handleCloseActivate} maxWidth="xs" fullWidth>
        <DialogTitle>Activar portal — {patient.full_name}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}
        >
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
            name="email"
            value={form.email}
            onChange={handleFieldChange}
            size="small"
            fullWidth
          />
          <TextField
            label="Contraseña temporal"
            type="password"
            name="password"
            value={form.password}
            onChange={handleFieldChange}
            size="small"
            fullWidth
            helperText="El paciente podrá cambiarla luego desde su perfil."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseActivate}>Cancelar</Button>
          <Button variant="contained" onClick={handleActivate} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Activar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

// ─────────────────────────────────────────────────────────────
// PatientDetailPage
// ─────────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { selected, loading, error, fetchPatientById } = usePatientStore();

  useEffect(() => {
    fetchPatientById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBack = useCallback(() => navigate("/patients"), [navigate]);

  // Derivar datos del paciente con useMemo para no recalcular
  // en cada re-render provocado por estados internos de sub-componentes
  const patientData = useMemo(() => {
    if (!selected) return null;
    const p = selected;
    return {
      raw: p,
      age:       calcAge(p.birth_date),
      birthDate: p.birth_date ? birthDateFormatter.format(new Date(p.birth_date)) : null,
      genderLabel: GENDER_LABEL[p.gender] ?? "—",
    };
  }, [selected]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (error)        return <Alert severity="error">{error}</Alert>;
  if (!patientData) return null;

  const { raw: p, age, birthDate, genderLabel } = patientData;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} size="small">
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
                <Grid size={{ xs: 6 }}><InfoRow label="DNI"        value={p.dni}        /></Grid>
                <Grid size={{ xs: 6 }}><InfoRow label="Género"     value={genderLabel}  /></Grid>
                <Grid size={{ xs: 6 }}><InfoRow label="Edad"       value={age}          /></Grid>
                <Grid size={{ xs: 6 }}><InfoRow label="Nacimiento" value={birthDate}    /></Grid>
                <Grid size={{ xs: 6 }}><InfoRow label="Teléfono"   value={p.phone}      /></Grid>
                <Grid size={{ xs: 6 }}><InfoRow label="Correo"     value={p.email}      /></Grid>
                <Grid size={{ xs: 12 }}><InfoRow label="Dirección" value={p.address}    /></Grid>
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

        {/* Tratamientos — lazy */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Tratamientos realizados
              </Typography>
              <Suspense fallback={<PanelSkeleton />}>
                <TreatmentCasesPanel patientId={p.id} />
              </Suspense>
            </CardContent>
          </Card>
        </Grid>

        {/* Historial de citas — lazy */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Historial de citas
              </Typography>
              <Suspense fallback={<PanelSkeleton />}>
                <PatientHistory patientId={p.id} />
              </Suspense>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}