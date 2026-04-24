import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, Typography, useTheme } from '@mui/material'

const COLORS = {
  Atendidas:  '#1D9E75',
  Pendientes: '#BA7517',
  Canceladas: '#A32D2D',
}

export default function StatusDonutChart({ kpis }) {
  const theme = useTheme()

  if (!kpis) return null

  const data = [
    { name: 'Atendidas',  value: kpis.attended  },
    { name: 'Pendientes', value: kpis.pending   },
    { name: 'Canceladas', value: kpis.cancelled },
  ].filter(d => d.value > 0)

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" fontWeight={500} mb={1}>
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
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${v} citas`, '']}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `0.5px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}