import { memo, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, Typography, useTheme } from "@mui/material";

// ─────────────────────────────────────────────────────────────
// Formatters estables fuera del componente
// ─────────────────────────────────────────────────────────────
const monthFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

const solesFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 0,
});

const fmtMonth = (iso) => monthFormatter.format(new Date(iso));
const fmtSoles = (v) => `S/ ${solesFormatter.format(Number(v))}`;

// Objetos estáticos fuera del componente
const CHART_MARGIN = { top: 0, right: 8, left: -8, bottom: 0 };
const TICK_STYLE = { fontSize: 11 };
const LEGEND_STYLE = { fontSize: 12 };

// ─────────────────────────────────────────────────────────────
// RevenueLineChart
// ─────────────────────────────────────────────────────────────
const RevenueLineChart = memo(function RevenueLineChart({ data }) {
  const theme = useTheme();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        month: fmtMonth(d.month),
        Facturado: Number(d.gross_revenue ?? 0),
        Cobrado: Number(d.collected ?? 0),
        Pendiente: Number(d.pending_balance ?? 0),
      })),
    [data],
  );

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.paper,
      border: `0.5px solid ${theme.palette.divider}`,
      borderRadius: 8,
      fontSize: 12,
    }),
    [theme.palette.background.paper, theme.palette.divider],
  );

  // useCallback para que recharts no detecte una prop nueva en cada render
  const tooltipFormatter = useCallback((v) => fmtSoles(v), []);

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Ingresos mensuales (S/)
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis dataKey="month" tick={TICK_STYLE} />
            <YAxis tick={TICK_STYLE} tickFormatter={fmtSoles} width={72} />
            <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Line
              type="monotone"
              dataKey="Facturado"
              stroke="#534AB7"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Cobrado"
              stroke="#1D9E75"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Pendiente"
              stroke="#A32D2D"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

export default RevenueLineChart;