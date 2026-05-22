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

const fmtMonth = (iso) =>
  new Date(iso).toLocaleDateString("es-PE", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });

export default function MonthlyBarChart({ data }) {
  const theme = useTheme();

  const chartData = data.map((d) => ({
    month: fmtMonth(d.month),
    Atendidas: Number(d.attended ?? 0),
    Pendientes: Number(d.pending ?? 0),
    Canceladas: Number(d.cancelled ?? 0),
  }));

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Citas por mes
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 0, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `0.5px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Atendidas" fill="#1D9E75" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Pendientes" fill="#BA7517" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Canceladas" fill="#A32D2D" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
