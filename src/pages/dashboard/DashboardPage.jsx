import { useEffect, useState, useCallback, useMemo, lazy, Suspense, memo } from "react";
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
  Skeleton,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import TaskIcon from "@mui/icons-material/Task";
import TuneIcon from "@mui/icons-material/Tune";

import { useDashboardStore } from "../../stores/useDashboardStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";

// ─────────────────────────────────────────────────────────────
// Imports directos — componentes livianos, sin lazy
// ─────────────────────────────────────────────────────────────
import KpiCard from "../../components/KpiCard";
import RecentAppointmentsCard from "../../components/RecentAppointmentsCard";

// ─────────────────────────────────────────────────────────────
// Lazy imports — componentes que usan recharts (bundle pesado).
// Se cargan solo cuando el Dashboard se monta, en paralelo,
// sin bloquear la carga inicial de la app.
// ─────────────────────────────────────────────────────────────
const MonthlyBarChart  = lazy(() => import("../../components/MonthlyBarChart"));
const RevenueLineChart = lazy(() => import("../../components/RevenueLineChart"));
const StatusDonutChart = lazy(() => import("../../components/StatusDonutChart"));
const TopRankingsCard  = lazy(() => import("../../components/TopRankingsCard"));

// ─────────────────────────────────────────────────────────────
// Fallback de Suspense — mismo tamaño que el gráfico real
// para evitar layout shift (CLS) durante la carga diferida.
// ─────────────────────────────────────────────────────────────
const ChartSkeleton = memo(function ChartSkeleton({ height = 290 }) {
  return (
    <Skeleton variant="rounded" width="100%" height={height} animation="wave" />
  );
});

// ─────────────────────────────────────────────────────────────
// Constantes y helpers fuera del componente
// ─────────────────────────────────────────────────────────────
const solesFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtSoles = (n) => `S/ ${solesFormatter.format(Number(n ?? 0))}`;

const PERIODS = [
  { label: "7d",    labelFull: "7 días",    days: 7   },
  { label: "30d",   labelFull: "30 días",   days: 30  },
  { label: "90d",   labelFull: "90 días",   days: 90  },
  { label: "1 año", labelFull: "Este año",  days: 365 },
];

function getRangeForDays(days) {
  const to   = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    dateFrom:    from.toISOString(),
    dateTo:      to.toISOString(),
    dateFromStr: from.toISOString().slice(0, 10),
    dateToStr:   to.toISOString().slice(0, 10),
  };
}

// ─────────────────────────────────────────────────────────────
// PeriodButton — memoizado para que solo el botón que cambia
// de estado activo/inactivo re-renderice
// ─────────────────────────────────────────────────────────────
const PeriodButton = memo(function PeriodButton({ period, active, isMobile, onApply }) {
  const handleClick = useCallback(() => onApply(period.days), [onApply, period.days]);

  return (
    <Button
      size="small"
      variant={active ? "contained" : "outlined"}
      onClick={handleClick}
      sx={{ minWidth: { xs: 48, sm: 72 }, px: { xs: 1, sm: 2 } }}
    >
      {isMobile ? period.label : period.labelFull}
    </Button>
  );
});

// ─────────────────────────────────────────────────────────────
// DashboardPage
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { isMobile } = useBreakpoint();
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

  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");
  const [activePeriod, setActivePeriod] = useState(30);
  const [showDateRange, setShowDateRange] = useState(false);

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers memoizados ───────────────────────────────────
  const applyPeriod = useCallback(
    (days) => {
      const { dateFrom, dateTo, dateFromStr, dateToStr } = getRangeForDays(days);
      setActivePeriod(days);
      setShowDateRange(false);
      setDateFrom(dateFromStr);
      setDateTo(dateToStr);
      fetchDashboard({ dateFrom, dateTo });
    },
    [fetchDashboard],
  );

  const applyCustomRange = useCallback(() => {
    setActivePeriod(null);
    fetchDashboard({ dateFrom, dateTo });
    if (isMobile) setShowDateRange(false);
  }, [fetchDashboard, dateFrom, dateTo, isMobile]);

  const toggleDateRange = useCallback(() => setShowDateRange((v) => !v), []);
  const handleDateFrom  = useCallback((e) => setDateFrom(e.target.value), []);
  const handleDateTo    = useCallback((e) => setDateTo(e.target.value), []);

  // ── KPI cards — recalcular solo cuando kpis cambia ────────
  const kpiCards = useMemo(
    () => [
      { label: "Total citas",   value: kpis?.totalAppts ?? 0,       icon: <CalendarMonthIcon /> },
      { label: "Atendidas",     value: kpis?.attended ?? 0,          icon: <CheckCircleIcon />,  color: "success.main", sub: (kpis?.attendanceRate ?? 0) + "% del total" },
      { label: "Total casos",   value: kpis?.totalCases ?? 0,        icon: <FolderOpenIcon />,   color: "primary.main" },
      { label: "Casos activos", value: kpis?.activeCases ?? 0,       icon: <TaskIcon />,         color: "success.main" },
      { label: "Pacientes",     value: kpis?.uniquePatients ?? 0,    icon: <PeopleIcon />,       color: "primary.main", sub: "Con tratamiento alguno" },
      { label: "Facturado",     value: fmtSoles(kpis?.grossRevenue), icon: <AttachMoneyIcon />,  sub: "Citas unicas + casos" },
      { label: "Cobrado",       value: fmtSoles(kpis?.collected),    icon: <TrendingUpIcon />,   color: "success.main" },
      { label: "Por cobrar",    value: fmtSoles(kpis?.pendingBalance), icon: <WarningAmberIcon />, color: (kpis?.pendingBalance ?? 0) > 0 ? "error.main" : "text.primary" },
    ],
    [kpis],
  );

  return (
    <Box>
      {/* Header + filtros de período */}
      <Box sx={{ mb: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Dashboard
          </Typography>
          {isMobile && (
            <Tooltip title="Filtrar período">
              <IconButton
                size="small"
                onClick={toggleDateRange}
                color={showDateRange ? "primary" : "default"}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {PERIODS.map((p) => (
            <PeriodButton
              key={p.days}
              period={p}
              active={activePeriod === p.days}
              isMobile={isMobile}
              onApply={applyPeriod}
            />
          ))}

          {!isMobile && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <TextField
                type="date"
                size="small"
                label="Desde"
                value={dateFrom}
                onChange={handleDateFrom}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 145 }}
              />
              <TextField
                type="date"
                size="small"
                label="Hasta"
                value={dateTo}
                onChange={handleDateTo}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 145 }}
              />
              <Button size="small" variant="outlined" onClick={applyCustomRange}>
                Aplicar
              </Button>
            </>
          )}
        </Box>

        {isMobile && (
          <Collapse in={showDateRange}>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              <TextField
                type="date"
                size="small"
                label="Desde"
                value={dateFrom}
                onChange={handleDateFrom}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1, minWidth: 130 }}
              />
              <TextField
                type="date"
                size="small"
                label="Hasta"
                value={dateTo}
                onChange={handleDateTo}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1, minWidth: 130 }}
              />
              <Button size="small" variant="contained" fullWidth onClick={applyCustomRange}>
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
          {/* KPIs — import directo, son livianos */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
            {kpiCards.map((kpi) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={kpi.label}>
                <KpiCard {...kpi} loading={loading} />
              </Grid>
            ))}
          </Grid>

          {/* Gráficos fila 1 — lazy + Suspense con skeleton del mismo alto */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Suspense fallback={<ChartSkeleton height={290} />}>
                <MonthlyBarChart data={monthly} />
              </Suspense>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Suspense fallback={<ChartSkeleton height={290} />}>
                <StatusDonutChart kpis={kpis} />
              </Suspense>
            </Grid>
          </Grid>

          {/* Gráficos fila 2 — lazy */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Suspense fallback={<ChartSkeleton height={290} />}>
                <RevenueLineChart data={monthly} />
              </Suspense>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Suspense fallback={<ChartSkeleton height={290} />}>
                <TopRankingsCard topTreatments={topTreatments} topDoctors={topDoctors} />
              </Suspense>
            </Grid>
          </Grid>

          {/* Últimas citas — import directo */}
          <RecentAppointmentsCard rows={recentAppointments} />
        </>
      )}
    </Box>
  );
}