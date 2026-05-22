import { memo, useMemo, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, Typography, useTheme } from "@mui/material";

// ─────────────────────────────────────────────────────────────
// Constantes estáticas
// ─────────────────────────────────────────────────────────────
const COLORS = {
  Atendidas: "#1D9E75",
  Pendientes: "#BA7517",
  Canceladas: "#A32D2D",
};

const LEGEND_STYLE = { fontSize: 12 };

// Celdas preconstruidas — evita recrear los nodos Cell en cada render.
// Como los colores son fijos, se pueden definir fuera del componente.
const PIE_CELLS = Object.entries(COLORS).map(([name, fill]) => (
  <Cell key={name} fill={fill} />
));

// ─────────────────────────────────────────────────────────────
// StatusDonutChart
// memo: solo re-renderiza si kpis cambia por referencia.
// ─────────────────────────────────────────────────────────────
const StatusDonutChart = memo(function StatusDonutChart({ kpis }) {
  const theme = useTheme();

  // Derivar el array filtrado solo cuando kpis cambia
  const data = useMemo(() => {
    if (!kpis) return [];
    return [
      { name: "Atendidas", value: kpis.attended },
      { name: "Pendientes", value: kpis.pending },
      { name: "Canceladas", value: kpis.cancelled },
    ].filter((d) => d.value > 0);
  }, [kpis]);

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.paper,
      border: `0.5px solid ${theme.palette.divider}`,
      borderRadius: 8,
      fontSize: 12,
    }),
    [theme.palette.background.paper, theme.palette.divider],
  );

  // useCallback para referencia estable del formatter de Tooltip
  const tooltipFormatter = useCallback((v) => [`${v} citas`, ""], []);

  if (!kpis || data.length === 0) return null;

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Distribución de citas
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {/* Renderizar solo las celdas necesarias según data filtrada */}
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={tooltipStyle}
            />
            <Legend wrapperStyle={LEGEND_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

export default StatusDonutChart;