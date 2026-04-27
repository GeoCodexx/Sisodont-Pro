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

const fmtMonth = (iso) =>
  new Date(iso).toLocaleDateString("es-PE", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });

const fmtSoles = (v) =>
  `S/ ${Number(v).toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

export default function RevenueLineChart({ data }) {
  const theme = useTheme();

  const chartData = data.map((d) => ({
    month: fmtMonth(d.month),
    Facturado: Number(d.gross_revenue ?? 0),
    Cobrado: Number(d.collected ?? 0),
    Pendiente: Number(d.pending_balance ?? 0),
  }));

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle2" fontWeight={500} mb={2}>
          Ingresos mensuales (S/)
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={chartData}
            margin={{ top: 0, right: 8, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={fmtSoles}
              width={72}
            />
            <Tooltip
              formatter={(v) => fmtSoles(v)}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `0.5px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
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
}
