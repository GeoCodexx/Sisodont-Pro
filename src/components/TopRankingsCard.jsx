import { memo, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Divider,
} from "@mui/material";

// ─────────────────────────────────────────────────────────────
// RankRow — memoizado para que una actualización en topDoctors
// no re-renderice las filas de topTreatments y viceversa.
// ─────────────────────────────────────────────────────────────
const RankRow = memo(function RankRow({ name, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;

  // sx memoizado: el objeto con bgcolor dinámica se recrea en cada
  // render si se define inline; con useMemo solo cambia si color cambia.
  const barSx = useMemo(
    () => ({
      height: 5,
      borderRadius: 3,
      bgcolor: "action.hover",
      "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
    }),
    [color],
  );

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth: "75%" }}>
          {name}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: "text.secondary" }}
        >
          {count} cita{count !== 1 ? "s" : ""}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} sx={barSx} />
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// TopRankingsCard
// memo: solo re-renderiza si topTreatments o topDoctors cambian.
// ─────────────────────────────────────────────────────────────
const TopRankingsCard = memo(function TopRankingsCard({
  topTreatments,
  topDoctors,
}) {
  // maxT y maxD son valores derivados — memoizados para no recalcular
  // si el componente re-renderiza por un cambio de contexto externo.
  const maxT = useMemo(
    () => topTreatments[0]?.count ?? 1,
    [topTreatments],
  );

  const maxD = useMemo(
    () => topDoctors[0]?.count ?? 1,
    [topDoctors],
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Top tratamientos
        </Typography>

        {topTreatments.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Sin datos
          </Typography>
        ) : (
          topTreatments.map((t) => (
            <RankRow
              key={t.name}
              name={t.name}
              count={t.count}
              max={maxT}
              color="#534AB7"
            />
          ))
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Top doctores
        </Typography>

        {topDoctors.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Sin datos
          </Typography>
        ) : (
          topDoctors.map((d) => (
            <RankRow
              key={d.name}
              name={d.name}
              count={d.count}
              max={maxD}
              color="#1D9E75"
            />
          ))
        )}
      </CardContent>
    </Card>
  );
});

export default TopRankingsCard;