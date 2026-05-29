import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Avatar, Button,
} from "@mui/material";
import BusinessIcon      from "@mui/icons-material/Business";
import PeopleIcon        from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AttachMoneyIcon   from "@mui/icons-material/AttachMoney";
import TrendingUpIcon    from "@mui/icons-material/TrendingUp";
import WarningAmberIcon  from "@mui/icons-material/WarningAmber";
import FolderOpenIcon    from "@mui/icons-material/FolderOpen";
import ChevronRightIcon  from "@mui/icons-material/ChevronRight";
import AddIcon           from "@mui/icons-material/Add";
import CreateTenantDialog from "./CreateTenantDialog";
import { useSuperAdminStore } from "../../stores/useSuperAdminStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";

// ── Formatters ────────────────────────────────────────────────
const fmtS    = (n)   =>
  `S/ ${Number(n ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-PE", { dateStyle: "short" }) : "—";

// ── KpiCard ───────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, sub }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: "16px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {label.toUpperCase()}
          </Typography>
          <Box sx={{ color: color ?? "text.secondary", opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h5" sx={{ color: color ?? "text.primary", fontWeight: 700 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">{sub}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ── TenantRow — fila de tabla ─────────────────────────────────
function TenantRow({ t, onClick }) {
  return (
    <TableRow hover onClick={() => onClick(t.id)} sx={{ cursor: "pointer" }}>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 13 }}>
            {t.name.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>{t.name}</Typography>
            <Typography variant="caption" color="textSecondary">{t.slug}</Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={t.active ? "Activa" : "Inactiva"}
          color={t.active ? "success" : "default"}
          size="small"
        />
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{t.users_count ?? 0}</Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{t.appts_count ?? 0}</Typography>
      </TableCell>
      <TableCell align="center">
        {/* active_cases viene calculado en fetchTenants desde treatment_cases */}
        <Typography variant="body2">{t.active_cases ?? 0}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 500 }}>
          {fmtS(t.gross_revenue)}
        </Typography>
      </TableCell>
      <TableCell>
        {/* collected = suma ledger_entries del tenant (fuente de verdad) */}
        <Typography variant="body2" color="text.secondary">
          {fmtS(t.collected)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          color={(t.pending_balance ?? 0) > 0 ? "error.main" : "text.secondary"}
        >
          {fmtS(t.pending_balance)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="textSecondary">
          {fmtDate(t.last_activity)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="textSecondary">
          {fmtDate(t.created_at)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <ChevronRightIcon fontSize="small" color="action" />
      </TableCell>
    </TableRow>
  );
}

// ── TenantCard — vista móvil ──────────────────────────────────
function TenantCard({ t, onClick }) {
  return (
    <Card
      variant="outlined"
      sx={{ mb: 1.5, cursor: "pointer" }}
      onClick={() => onClick(t.id)}
    >
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 13 }}>
              {t.name.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={500}>{t.name}</Typography>
              <Typography variant="caption" color="textSecondary">{t.slug}</Typography>
            </Box>
          </Box>
          <Chip
            label={t.active ? "Activa" : "Inactiva"}
            color={t.active ? "success" : "default"}
            size="small"
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, mt: 1 }}>
          {[
            ["Usuarios",   t.users_count ?? 0],
            ["Citas",      t.appts_count ?? 0],
            ["Facturado",  fmtS(t.gross_revenue)],
          ].map(([label, value]) => (
            <Box
              key={label}
              sx={{ bgcolor: "action.hover", borderRadius: 1, p: 0.75, textAlign: "center" }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={500}>{value}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 1 }}>
          {[
            ["Cobrado",    fmtS(t.collected)],
            ["Por cobrar", fmtS(t.pending_balance)],
          ].map(([label, value]) => (
            <Box
              key={label}
              sx={{ bgcolor: "action.hover", borderRadius: 1, p: 0.75, textAlign: "center" }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={500}>{value}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Última actividad: {fmtDate(t.last_activity)}
          </Typography>
          <ChevronRightIcon fontSize="small" color="action" />
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// SuperAdminDashboard
// ─────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { tenants, kpis, loading, error, fetchTenants } = useSuperAdminStore();
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => { fetchTenants(); }, []);

  const handleTenantClick = (id) => navigate(`/super-admin/tenants/${id}`);

  if (loading && !kpis)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* KPIs globales */}
      <Typography variant="subtitle2" sx={{ mb: 1.5, color: "text.secondary", fontWeight: 600 }}>
        MÉTRICAS GLOBALES DEL SAAS
      </Typography>
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          {
            label: "Clínicas totales",
            value: kpis?.totalTenants ?? "—",
            icon: <BusinessIcon />,
            sub: `${kpis?.activeTenants ?? 0} activas · ${kpis?.inactiveTenants ?? 0} inactivas`,
          },
          {
            label: "Usuarios registrados",
            value: kpis?.totalUsers ?? "—",
            icon: <PeopleIcon />,
            color: "primary.main",
          },
          {
            label: "Total citas",
            value: kpis?.totalAppts ?? "—",
            icon: <CalendarMonthIcon />,
          },
          {
            label: "Facturado global",
            // Suma: citas individuales (appointments.total, case_id IS NULL)
            //       + casos (treatment_cases.total_cost)
            value: fmtS(kpis?.grossRevenue),
            icon: <AttachMoneyIcon />,
          },
          {
            label: "Cobrado global",
            // Suma real desde ledger_entries (fuente de verdad de pagos)
            value: fmtS(kpis?.collected),
            icon: <TrendingUpIcon />,
            color: "success.main",
          },
          {
            label: "Por cobrar",
            value: fmtS(kpis?.pendingBalance),
            icon: <WarningAmberIcon />,
            color: (kpis?.pendingBalance ?? 0) > 0 ? "error.main" : "text.primary",
          },
          {
            label: "Casos activos",
            value: kpis?.activeCases ?? "—",
            icon: <FolderOpenIcon />,
            color: "primary.main",
          },
        ].map((k) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={k.label}>
            <KpiCard {...k} />
          </Grid>
        ))}
      </Grid>

      {/* Tabla / cards de clínicas */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 600 }}>
          CLÍNICAS ({tenants.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setOpenCreate(true)}
        >
          Nueva clínica
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : tenants.length === 0 ? (
        <Typography sx={{ color: "text.secondary", textAlign: "center", mt: 4 }}>
          No hay clínicas registradas.
        </Typography>
      ) : isMobile ? (
        <Box>
          {tenants.map((t) => (
            <TenantCard key={t.id} t={t} onClick={handleTenantClick} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Clínica</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Usuarios</TableCell>
                <TableCell align="center">Citas</TableCell>
                <TableCell align="center">Casos activos</TableCell>
                <TableCell>Facturado</TableCell>
                <TableCell>Cobrado</TableCell>
                <TableCell>Por cobrar</TableCell>
                <TableCell>Última actividad</TableCell>
                <TableCell>Registrada</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((t) => (
                <TenantRow key={t.id} t={t} onClick={handleTenantClick} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateTenantDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => {
          setOpenCreate(false);
          fetchTenants();
        }}
      />
    </Box>
  );
}