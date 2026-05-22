import { memo, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, Typography, useTheme } from "@mui/material";

// ─────────────────────────────────────────────────────────────
// Formatter estable fuera del componente.
// Antes se definía inline en el map → nueva función en cada render.
// ─────────────────────────────────────────────────────────────
const monthFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

const fmtMonth = (iso) => monthFormatter.format(new Date(iso));

// Estilos de Chart estáticos — sacarlos fuera evita crear objetos
// nuevos en cada render que confunden la comparación de recharts.
const CHART_MARGIN = { top: 0, right: 8, left: -16, bottom: 0 };
const TICK_STYLE = { fontSize: 11 };
const LEGEND_STYLE = { fontSize: 12 };

// ─────────────────────────────────────────────────────────────
// MonthlyBarChart
// memo: solo re-renderiza si `data` cambia por referencia.
// useMemo interno: evita recalcular chartData si el componente
// re-renderiza por otro motivo (ej. cambio de tema).
// ─────────────────────────────────────────────────────────────
const MonthlyBarChart = memo(function MonthlyBarChart({ data }) {
  const theme = useTheme();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        month: fmtMonth(d.month),
        Atendidas: Number(d.attended ?? 0),
        Pendientes: Number(d.pending ?? 0),
        Canceladas: Number(d.cancelled ?? 0),
      })),
    [data],
  );

  // contentStyle depende del tema — memoizado para no recrear el
  // objeto en cada render y evitar re-renders internos del Tooltip.
  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.paper,
      border: `0.5px solid ${theme.palette.divider}`,
      borderRadius: 8,
      fontSize: 12,
    }),
    [theme.palette.background.paper, theme.palette.divider],
  );

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Citas por mes
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis dataKey="month" tick={TICK_STYLE} />
            <YAxis tick={TICK_STYLE} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="Atendidas" fill="#1D9E75" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Pendientes" fill="#BA7517" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Canceladas" fill="#A32D2D" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

export default MonthlyBarChart;