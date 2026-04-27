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
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TuneIcon from "@mui/icons-material/Tune";

import { useDashboardStore } from "../../stores/useDashboardStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import KpiCard from "../../components/KpiCard";
import MonthlyBarChart from "../../components/MonthlyBarChart";
import RevenueLineChart from "../../components/RevenueLineChart";
import StatusDonutChart from "../../components/StatusDonutChart";
import TopRankingsCard from "../../components/TopRankingsCard";
import RecentAppointmentsCard from "../../components/RecentAppointmentsCard";

const fmtSoles = (n) =>
  `S/ ${Number(n ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PERIODS = [
  { label: "7d", labelFull: "7 días", days: 7 },
  { label: "30d", labelFull: "30 días", days: 30 },
  { label: "90d", labelFull: "90 días", days: 90 },
  { label: "1 año", labelFull: "Este año", days: 365 },
];

export default function DashboardPage() {
  const { isMobile, isSmallScreen } = useBreakpoint();
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
  const [showDateRange, setShowDateRange] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const applyPeriod = (days) => {
    setActivePeriod(days);
    setShowDateRange(false);
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
    fetchDashboard({ dateFrom: from.toISOString(), dateTo: to.toISOString() });
  };

  const applyCustomRange = () => {
    setActivePeriod(null);
    fetchDashboard({ dateFrom, dateTo });
    if (isMobile) setShowDateRange(false);
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography variant="h6" fontWeight={500}>
            Dashboard
          </Typography>

          {/* En móvil: botón de tune para mostrar/ocultar filtros */}
          {isMobile && (
            <Tooltip title="Filtrar período">
              <IconButton
                size="small"
                onClick={() => setShowDateRange((v) => !v)}
                color={showDateRange ? "primary" : "default"}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Botones de período — siempre visibles */}
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {PERIODS.map((p) => (
            <Button
              key={p.days}
              size="small"
              variant={activePeriod === p.days ? "contained" : "outlined"}
              onClick={() => applyPeriod(p.days)}
              sx={{ minWidth: { xs: 48, sm: 72 }, px: { xs: 1, sm: 2 } }}
            >
              {isMobile ? p.label : p.labelFull}
            </Button>
          ))}

          {/* En desktop: fechas inline */}
          {!isMobile && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <TextField
                type="date"
                size="small"
                label="Desde"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                sx={{ width: 145 }}
              />
              <TextField
                type="date"
                size="small"
                label="Hasta"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                sx={{ width: 145 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={applyCustomRange}
              >
                Aplicar
              </Button>
            </>
          )}
        </Box>

        {/* En móvil: rango de fechas colapsable */}
        {isMobile && (
          <Collapse in={showDateRange}>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              <TextField
                type="date"
                size="small"
                label="Desde"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                sx={{ flex: 1, minWidth: 130 }}
              />
              <TextField
                type="date"
                size="small"
                label="Hasta"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                sx={{ flex: 1, minWidth: 130 }}
              />
              <Button
                size="small"
                variant="contained"
                fullWidth
                onClick={applyCustomRange}
              >
                Aplicar rango personalizado
              </Button>
            </Box>
          </Collapse>
        )}
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
          {/* ── KPIs: 2 columnas en móvil, 3 en tablet, 6 en desktop ── */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} mb={3}>
            {[
              {
                label: "Total citas",
                value: kpis?.totalAppts ?? 0,
                icon: <CalendarMonthIcon />,
                color: undefined,
              },
              {
                label: "Atendidas",
                value: kpis?.attended ?? 0,
                icon: <CheckCircleIcon />,
                color: "success.main",
                sub: (kpis?.attendanceRate ?? 0) + "% del total",
              },
              {
                label: "Pacientes únicos",
                value: kpis?.uniquePatients ?? 0,
                icon: <PeopleIcon />,
                color: "primary.main",
              },
              {
                label: "Facturado",
                value: fmtSoles(kpis?.grossRevenue),
                icon: <AttachMoneyIcon />,
                color: undefined,
              },
              {
                label: "Cobrado",
                value: fmtSoles(kpis?.collected),
                icon: <TrendingUpIcon />,
                color: "success.main",
              },
              {
                label: "Por cobrar",
                value: fmtSoles(kpis?.pendingBalance),
                icon: <WarningAmberIcon />,
                color:
                  (kpis?.pendingBalance ?? 0) > 0
                    ? "error.main"
                    : "text.primary",
              },
            ].map((kpi) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={kpi.label}>
                <KpiCard {...kpi} loading={loading} />
              </Grid>
            ))}
          </Grid>

          {/* ── Gráficos fila 1 ── */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} mb={{ xs: 1.5, sm: 2 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <MonthlyBarChart data={monthly} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatusDonutChart kpis={kpis} />
            </Grid>
          </Grid>

          {/* ── Gráficos fila 2 ── */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} mb={{ xs: 1.5, sm: 2 }}>
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

          {/* ── Últimas citas ── */}
          <RecentAppointmentsCard rows={recentAppointments} />
        </>
      )}
    </Box>
  );
}
