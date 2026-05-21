import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography,
  CircularProgress, Alert, Button, Chip, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Paper, Divider,
} from "@mui/material";
import ArrowBackIcon    from "@mui/icons-material/ArrowBack";
import BusinessIcon     from "@mui/icons-material/Business";
import BlockIcon        from "@mui/icons-material/Block";
import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import { useSuperAdminStore } from "../../stores/useSuperAdminStore";

const fmtS    = (n)   => `S/ ${Number(n ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("es-PE", { dateStyle: "medium" }) : "—";
const fmtDT   = (iso) => iso ? new Date(iso).toLocaleString ("es-PE", { dateStyle: "short", timeStyle: "short" }) : "—";

const ROLE_LABELS = { ADMIN: "Admin", DOCTOR: "Doctor", ASSISTANT: "Asistente", PATIENT: "Paciente" };
const ROLE_COLORS = { ADMIN: "error", DOCTOR: "primary", ASSISTANT: "warning", PATIENT: "default" };

const STATUS_COLOR = { pendiente: "warning", atendido: "success", cancelado: "error" };

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
}

export default function TenantDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { selected, loading, saving, error, fetchTenantById, toggleTenantActive } =
    useSuperAdminStore();

  useEffect(() => { fetchTenantById(id); }, [id]);

  const handleToggle = async () => {
    if (!window.confirm(
      selected.active
        ? "¿Desactivar esta clínica? Sus usuarios no podrán acceder."
        : "¿Activar esta clínica?"
    )) return;
    await toggleTenantActive(id, selected.active);
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (error)    return <Alert severity="error">{error}</Alert>;
  if (!selected) return null;

  const t        = selected;
  const profiles = t.profiles ?? [];
  const recentAppts = t.recent_appointments ?? [];
  const activeCases = t.active_cases ?? [];

  // Métricas rápidas del tenant
  const totalAppts   = recentAppts.length; // aproximado (últimos 10)
  const totalRevenue = recentAppts.reduce((s, a) => s + Number(a.total ?? 0), 0);
  const collected    = recentAppts.reduce((s, a) => s + Number(a.paid  ?? 0), 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/super-admin")} size="small">
          Volver
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={500}>{t.name}</Typography>
            <Typography variant="caption" color="text.secondary">{t.slug}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip label={t.active ? "Activa" : "Inactiva"} color={t.active ? "success" : "default"} />
          <Button
            variant="outlined"
            color={t.active ? "error" : "success"}
            size="small"
            startIcon={t.active ? <BlockIcon /> : <CheckCircleIcon />}
            onClick={handleToggle}
            disabled={saving}
          >
            {t.active ? "Desactivar" : "Activar"}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>

        {/* Info general */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Información general
              </Typography>
              <InfoRow label="Nombre"      value={t.name} />
              <InfoRow label="Slug"        value={t.slug} />
              <InfoRow label="ID"          value={t.id} />
              <InfoRow label="Registrada"  value={fmtDate(t.created_at)} />
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {[
                  ["Usuarios", profiles.length],
                  ["Casos activos", activeCases.length],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ bgcolor: "action.hover", borderRadius: 1.5, p: 1, textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body1" fontWeight={600}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Usuarios del tenant */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Usuarios ({profiles.length})
              </Typography>
              {profiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin usuarios registrados.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuario</TableCell>
                        <TableCell>Rol</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Registrado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profiles.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: "primary.main" }}>
                                {initials(p.full_name)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{p.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ROLE_LABELS[p.role] ?? p.role}
                              color={ROLE_COLORS[p.role] ?? "default"}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={p.active ? "Activo" : "Inactivo"}
                              color={p.active ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {fmtDate(p.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Últimas citas */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Últimas citas (10 más recientes)
              </Typography>
              {recentAppts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin citas registradas.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Paciente</TableCell>
                        <TableCell>Doctor</TableCell>
                        <TableCell>Tratamiento</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Pagado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentAppts.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Typography variant="caption">{fmtDT(a.date)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{a.patient_name ?? "—"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{a.doctor_name ?? "—"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{a.treatment_name ?? "—"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={a.status}
                              color={STATUS_COLOR[a.status] ?? "default"}
                              size="small"
                              sx={{ textTransform: "capitalize" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{fmtS(a.total)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main">{fmtS(a.paid)}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Casos activos */}
        {activeCases.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Casos en curso ({activeCases.length})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Paciente</TableCell>
                        <TableCell>Tratamiento</TableCell>
                        <TableCell>Doctor</TableCell>
                        <TableCell>Sesiones</TableCell>
                        <TableCell>Costo total</TableCell>
                        <TableCell>Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeCases.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell><Typography variant="body2">{c.patient_name ?? "—"}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{c.treatment_name ?? "—"}</Typography></TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{c.doctor_name ?? "—"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {c.sessions_attended ?? 0}/{c.total_sessions ?? "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{fmtS(c.total_billed)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={Number(c.total_balance ?? 0) > 0 ? "error.main" : "success.main"}
                            >
                              {fmtS(c.total_balance)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

      </Grid>
    </Box>
  );
}