import { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography,
  Chip, CircularProgress, Alert, Divider, Tabs, Tab,
  Avatar, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Paper,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import PendingIcon       from "@mui/icons-material/Pending";
import AttachMoneyIcon   from "@mui/icons-material/AttachMoney";
import { supabase }      from "../../services/supabaseClient";
import { useAuthStore }  from "../../stores/useAuthStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import PageHeader        from "../../components/PageHeader";

// ─────────────────────────────────────────────────────────────
// MyAppointmentsPage
// Vista del PATIENT con acceso al portal.
// Solo ve SUS citas — el RLS enforce esto via patients.user_id.
// ─────────────────────────────────────────────────────────────

const STATUS_META = {
  pendiente: { label: "Pendiente", color: "warning" },
  atendido:  { label: "Atendida",  color: "success" },
  cancelado: { label: "Cancelada", color: "error"   },
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-PE", { dateStyle: "medium" }) : "—";
const fmtDT = (iso) =>
  iso ? new Date(iso).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtS = (n) =>
  `S/ ${Number(n ?? 0).toFixed(2)}`;

// ── KpiCard pequeño ───────────────────────────────────────────
function MiniKpi({ label, value, icon, color }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {label.toUpperCase()}
          </Typography>
          <Box sx={{ color: color ?? "text.secondary", opacity: 0.7 }}>{icon}</Box>
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ color: color ?? "text.primary" }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ── AppointmentCard — vista móvil ─────────────────────────────
function AppointmentCard({ a }) {
  const meta = STATUS_META[a.status] ?? STATUS_META.pendiente;
  // financial_summary usa billed/collected/balance
  const balance = Number(a.balance ?? 0);
  const isCase = a.ref_type === "case";
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {a.treatment_name ?? "Consulta"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isCase ? `Caso — inicio: ${fmtDate(a.date)}` : fmtDT(a.date)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {isCase && <Chip label="Multisesión" size="small" color="primary" variant="outlined" sx={{ fontSize: 10, height: 20 }} />}
            <Chip label={meta.label} color={meta.color} size="small" />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Doctor</Typography>
            <Typography variant="body2">{a.doctor_name ?? "—"}</Typography>
          </Box>
          {a.specialty_name && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Especialidad</Typography>
              <Typography variant="body2">{a.specialty_name}</Typography>
            </Box>
          )}
        </Box>

        {/* Balance — solo mostrar si hay deuda */}
        {balance > 0 && (
          <Box sx={{ mt: 1, p: 1, bgcolor: "error.light", borderRadius: 1 }}>
            <Typography variant="caption" color="error.dark" fontWeight={500}>
              Saldo pendiente: {fmtS(balance)}
            </Typography>
          </Box>
        )}
        {balance <= 0 && Number(a.total ?? 0) > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="success.main">
              ✓ Pagado: {fmtS(a.total)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── AppointmentTable — vista desktop ──────────────────────────
function AppointmentTable({ rows }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Tratamiento</TableCell>
            <TableCell>Doctor</TableCell>
            <TableCell>Especialidad</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Pagado</TableCell>
            <TableCell align="right">Saldo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((a,i) => {
            const meta    = STATUS_META[a.status] ?? STATUS_META.pendiente;
            // financial_summary usa billed/collected/balance
  const balance = Number(a.balance ?? 0);
            return (
              <TableRow key={i} hover>
                <TableCell>
                  <Typography variant="body2">{fmtDT(a.date)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{a.treatment_name ?? "Consulta"}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{a.doctor_name ?? "—"}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{a.specialty_name ?? "—"}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={meta.label} color={meta.color} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{fmtS(a.billed)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">{fmtS(a.collected)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={balance > 0 ? "error.main" : "text.secondary"}
                    fontWeight={balance > 0 ? 500 : 400}
                  >
                    {fmtS(balance)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// MyAppointmentsPage
// ─────────────────────────────────────────────────────────────
export default function MyAppointmentsPage() {
  const { isMobile }  = useBreakpoint();
  const userId        = useAuthStore((s) => s.user?.id);

  const [tab,          setTab]          = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  useEffect(() => {
    if (!userId) return;
    loadAppointments();
  }, [userId]);

  const loadAppointments = async () => {
    setLoading(true);
    setError("");

    // financial_summary incluye AMBOS flujos: citas individuales + casos
    // El RLS filtra por patients.user_id automáticamente
    const { data, error } = await supabase
      .from("financial_summary")
      .select("*")
      .order("date", { ascending: false });

    if (error) { setError(error.message); setLoading(false); return; }

    setAppointments(data ?? []);
    setLoading(false);
  };

  const now      = new Date();
  // Próximas: citas individuales pendientes en el futuro
  const upcoming = appointments.filter(
    (a) => a.ref_type === "appointment" &&
           new Date(a.date) >= now &&
           a.status === "pendiente"
  );
  // Historial: todo lo demás (citas pasadas, casos, completados)
  const history  = appointments.filter(
    (a) => !(a.ref_type === "appointment" &&
             new Date(a.date) >= now &&
             a.status === "pendiente")
  );

  // KPIs del paciente
  const totalAppts  = appointments.length;
  const attended    = appointments.filter((a) => a.ref_type === "appointment" && a.status === "atendido").length;
  const totalBilled = appointments.reduce((s, a) => s + Number(a.billed    ?? 0), 0);
  const totalPaid   = appointments.reduce((s, a) => s + Number(a.collected ?? 0), 0);
  const totalDebt   = appointments.reduce((s, a) => s + Number(a.balance   ?? 0), 0);

  return (
    <Box sx={{ maxWidth: { md: 900 }, mx: "auto" }}>
      <PageHeader title="Mis citas" subtitle="Tu historial clínico" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPIs del paciente */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MiniKpi
                label="Total citas"
                value={totalAppts}
                icon={<CalendarMonthIcon />}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MiniKpi
                label="Atendidas"
                value={attended}
                icon={<CheckCircleIcon />}
                color="success.main"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MiniKpi
                label="Próximas"
                value={upcoming.length}
                icon={<PendingIcon />}
                color="primary.main"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MiniKpi
                label="Saldo pendiente"
                value={fmtS(totalDebt)}
                icon={<AttachMoneyIcon />}
                color={totalDebt > 0 ? "error.main" : "text.primary"}
              />
            </Grid>
          </Grid>

          {/* Próximas citas — destacadas si existen */}
          {upcoming.length > 0 && (
            <Card
              variant="outlined"
              sx={{ mb: 3, borderColor: "primary.main", borderWidth: 1.5 }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <CalendarMonthIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" color="primary" fontWeight={600}>
                    Próximas citas ({upcoming.length})
                  </Typography>
                </Box>
                {upcoming.map((a) => (
                  <Box key={a.id} sx={{ mb: 1.5, "&:last-child": { mb: 0 } }}>
                    <Box sx={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", flexWrap: "wrap", gap: 1,
                    }}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {a.treatment_name ?? "Consulta"}
                        </Typography>
                        <Typography variant="body2" color="primary.main" fontWeight={500}>
                          {fmtDT(a.date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dr. {a.doctor_name ?? "—"}
                          {a.specialty_name ? ` · ${a.specialty_name}` : ""}
                        </Typography>
                      </Box>
                      <Chip label="Pendiente" color="warning" size="small" />
                    </Box>
                    {balance > 0 && (
                      <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: "block" }}>
                        Saldo pendiente: {fmtS(a.balance)}
                      </Typography>
                    )}
                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tabs historial / resumen financiero */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
          >
            <Tab label={`Historial (${history.length})`} />
            <Tab label="Resumen financiero" />
          </Tabs>

          {/* Tab 0: Historial */}
          {tab === 0 && (
            history.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>
                Sin historial de citas aún.
              </Typography>
            ) : isMobile ? (
              <Box>
                {history.map((a) => <AppointmentCard key={a.id} a={a} />)}
              </Box>
            ) : (
              <AppointmentTable rows={history} />
            )
          )}

          {/* Tab 1: Resumen financiero */}
          {tab === 1 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Resumen de pagos
                </Typography>
                {[
                  ["Total facturado",  fmtS(totalBilled), "text.primary"],
                  ["Total pagado",     fmtS(totalPaid),   "success.main"],
                  ["Saldo pendiente",  fmtS(totalDebt),   totalDebt > 0 ? "error.main" : "text.secondary"],
                ].map(([label, value, color]) => (
                  <Box
                    key={label}
                    sx={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", py: 1.25,
                      borderBottom: "1px solid", borderColor: "divider",
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}