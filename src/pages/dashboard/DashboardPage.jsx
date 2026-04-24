import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useDashboardStore } from "../../stores/useDashboardStore";
import KpiCard from "../../components/KpiCard";
import MonthlyBarChart from "../../components/MonthlyBarChart";
import RevenueLineChart from "../../components/RevenueLineChart";
import StatusDonutChart from "../../components/StatusDonutChart";
import TopRankingsCard from "../../components/TopRankingsCard";
import RecentAppointmentsCard from "../../components/RecentAppointmentsCard";

const fmtSoles = (n) =>
  `S/ ${Number(n ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Períodos rápidos
const PERIODS = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
  { label: "Este año", days: 365 },
];

export default function DashboardPage() {
  const {
    kpis,
    monthly,
    topTreatments,
    topDoctors,
    recentAppointments,
    loading,
    error,
    fetchDashboard,
  } = useDashboardStore();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activePeriod, setActivePeriod] = useState(30);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const applyPeriod = (days) => {
    setActivePeriod(days);
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
    fetchDashboard({
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    });
  };

  const applyCustomRange = () => {
    setActivePeriod(null);
    fetchDashboard({ dateFrom, dateTo });
  };

  return (
    <Box>
      {/* Header con filtros */}
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
        <Typography variant="h6" fontWeight={500}>
          Dashboard
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {/* Períodos rápidos */}
          {PERIODS.map((p) => (
            <Button
              key={p.days}
              size="small"
              variant={activePeriod === p.days ? "contained" : "outlined"}
              onClick={() => applyPeriod(p.days)}
              sx={{ minWidth: 80 }}
            >
              {p.label}
            </Button>
          ))}
          <Divider orientation="vertical" flexItem />
          {/* Rango personalizado */}
          <TextField
            type="date"
            size="small"
            label="Desde"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            //InputLabelProps={{ shrink: true }}
            sx={{ width: 145 }}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            //InputLabelProps={{ shrink: true }}
            sx={{ width: 145 }}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
          <Button size="small" variant="outlined" onClick={applyCustomRange}>
            Aplicar
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !kpis ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ── KPIs ───────────────────────────────────────── */}
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard
                label="Total citas"
                value={kpis?.totalAppts ?? 0}
                icon={<CalendarMonthIcon />}
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard
                label="Atendidas"
                value={kpis?.attended ?? 0}
                sub={`${kpis?.attendanceRate ?? 0}% del total`}
                icon={<CheckCircleIcon />}
                color="success.main"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard
                label="Pacientes únicos"
                value={kpis?.uniquePatients ?? 0}
                icon={<PeopleIcon />}
                color="primary.main"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard
                label="Facturado"
                value={fmtSoles(kpis?.grossRevenue)}
                icon={<AttachMoneyIcon />}
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard
                label="Cobrado"
                value={fmtSoles(kpis?.collected)}
                icon={<TrendingUpIcon />}
                color="success.main"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard
                label="Por cobrar"
                value={fmtSoles(kpis?.pendingBalance)}
                icon={<WarningAmberIcon />}
                color={kpis?.pendingBalance > 0 ? "error.main" : "text.primary"}
                loading={loading}
              />
            </Grid>
          </Grid>

          {/* ── Gráficos fila 1 ────────────────────────────── */}
          <Grid container spacing={2} mb={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <MonthlyBarChart data={monthly} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatusDonutChart kpis={kpis} />
            </Grid>
          </Grid>

          {/* ── Gráficos fila 2 ────────────────────────────── */}
          <Grid container spacing={2} mb={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <RevenueLineChart data={monthly} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TopRankingsCard
                topTreatments={topTreatments}
                topDoctors={topDoctors}
              />
            </Grid>
          </Grid>

          {/* ── Últimas citas ──────────────────────────────── */}
          <RecentAppointmentsCard rows={recentAppointments} />
        </>
      )}
    </Box>
  );
}
