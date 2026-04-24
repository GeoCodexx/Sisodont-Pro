import {
  Card, CardContent, Typography, Box,
  LinearProgress, Divider,
} from '@mui/material'

function RankRow({ name, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <Box mb={1.5}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth: '75%' }}>{name}</Typography>
        <Typography variant="body2" fontWeight={500} color="text.secondary">
          {count} cita{count !== 1 ? 's' : ''}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 5,
          borderRadius: 3,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  )
}

export default function TopRankingsCard({ topTreatments, topDoctors }) {
  const maxT = topTreatments[0]?.count ?? 1
  const maxD = topDoctors[0]?.count    ?? 1

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" fontWeight={500} mb={2}>
          Top tratamientos
        </Typography>
        {topTreatments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Sin datos</Typography>
        ) : (
          topTreatments.map(t => (
            <RankRow key={t.name} name={t.name} count={t.count} max={maxT} color="#534AB7" />
          ))
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={500} mb={2}>
          Top doctores
        </Typography>
        {topDoctors.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Sin datos</Typography>
        ) : (
          topDoctors.map(d => (
            <RankRow key={d.name} name={d.name} count={d.count} max={maxD} color="#1D9E75" />
          ))
        )}
      </CardContent>
    </Card>
  )
}