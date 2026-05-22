import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  Box,
  Divider,
  Avatar,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useBreakpoint } from "../hooks/useBreakpoint";

// ─────────────────────────────────────────────────────────────
// Constantes y formatters estables fuera del componente
// ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};

// Instancia única del formatter — evita crear Intl en cada llamada
const dtFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});

const fmt = (iso) => (iso ? dtFormatter.format(new Date(iso)) : "—");

// Estilos estáticos — sacados fuera del componente para referencia estable
const ROW_SX = {
  cursor: "pointer",
  transition: "0.15s",
  "&:hover": { bgcolor: "action.hover" },
};

const MOBILE_ROW_SX = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 1.5,
  cursor: "pointer",
  borderRadius: 2,
  p: 1,
  transition: "0.2s",
  "&:hover": { bgcolor: "action.hover" },
};

// ─────────────────────────────────────────────────────────────
// AppointmentMobileRow — fila móvil memoizada
// Extraída del map para que memo sea efectivo (un componente
// definido inline dentro de otro no puede memoizarse).
// ─────────────────────────────────────────────────────────────
const AppointmentMobileRow = memo(function AppointmentMobileRow({
  appt,
  index,
  onNavigate,
}) {
  const formattedDate = useMemo(() => fmt(appt.date), [appt.date]);
  const cost = useMemo(
    () => (appt.case_id ? "—" : `S/ ${Number(appt.total).toFixed(2)}`),
    [appt.case_id, appt.total],
  );

  return (
    <Box key={appt.id}>
      {index > 0 && <Divider sx={{ my: 1.5 }} />}
      <Box onClick={() => onNavigate(appt.patient_id)} sx={MOBILE_ROW_SX}>
        {/* Left */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", gap: 1.2 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 14 }}>
            {appt.patient_name?.[0] ?? "P"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {appt.patient_name}
            </Typography>
            <Typography variant="caption" color="textSecondary" noWrap>
              {appt.treatment_name ?? "—"}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: "block" }}
            >
              {appt.doctor_name ?? "—"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formattedDate}
            </Typography>
          </Box>
        </Box>
        {/* Right */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 0.7,
          }}
        >
          <Chip
            label={appt.status}
            color={STATUS_COLOR[appt.status] ?? "default"}
            size="small"
            sx={{ textTransform: "capitalize" }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={appt.case_id ? "Multisesión" : "Única"}
          />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {cost}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// AppointmentDesktopRow — fila de tabla memoizada
// ─────────────────────────────────────────────────────────────
const AppointmentDesktopRow = memo(function AppointmentDesktopRow({
  appt,
  onNavigate,
}) {
  const formattedDate = useMemo(() => fmt(appt.date), [appt.date]);
  const cost = useMemo(
    () => (appt.case_id ? "—" : `S/ ${Number(appt.total).toFixed(2)}`),
    [appt.case_id, appt.total],
  );

  return (
    <TableRow
      hover
      onClick={() => onNavigate(appt.patient_id)}
      sx={ROW_SX}
    >
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {appt.patient_name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{appt.treatment_name ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="textSecondary">
          {appt.doctor_name ?? "—"}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{formattedDate}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          size="small"
          variant="outlined"
          color={appt.case_id ? "primary" : "default"}
          label={appt.case_id ? "Multisesión" : "Única"}
        />
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {cost}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={appt.status}
          color={STATUS_COLOR[appt.status] ?? "default"}
          size="small"
          sx={{ textTransform: "capitalize", fontWeight: 500 }}
        />
      </TableCell>
    </TableRow>
  );
});

// ─────────────────────────────────────────────────────────────
// RecentAppointmentsCard
// memo: solo re-renderiza si rows cambia por referencia.
// ─────────────────────────────────────────────────────────────
const RecentAppointmentsCard = memo(function RecentAppointmentsCard({ rows }) {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  // Callback estable para evitar que cada fila reciba una nueva función
  const handleNavigateToPatient = useCallback(
    (patientId) => navigate(`/patients/${patientId}`),
    [navigate],
  );

  const handleNavigateToHistory = useCallback(
    () => navigate("/history"),
    [navigate],
  );

  const recordCount = useMemo(
    () => `${rows.length} registros`,
    [rows.length],
  );

  return (
    <Card variant="outlined" sx={{ overflow: "hidden" }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Últimas citas
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Actividad clínica reciente
            </Typography>
          </Box>
          {rows.length > 0 && (
            <Chip size="small" label={recordCount} variant="outlined" />
          )}
        </Box>

        {/* Empty */}
        {rows.length === 0 && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No hay citas registradas aún.
          </Typography>
        )}

        {/* Mobile */}
        {isMobile && rows.length > 0 && (
          <Box>
            {rows.map((a, i) => (
              <AppointmentMobileRow
                key={a.id}
                appt={a}
                index={i}
                onNavigate={handleNavigateToPatient}
              />
            ))}
          </Box>
        )}

        {/* Desktop */}
        {!isMobile && rows.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Tratamiento</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Costo</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((a) => (
                <AppointmentDesktopRow
                  key={a.id}
                  appt={a}
                  onNavigate={handleNavigateToPatient}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {/* Footer */}
        {rows.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              size="small"
              endIcon={<OpenInNewIcon fontSize="small" />}
              onClick={handleNavigateToHistory}
            >
              Ver historial completo
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

export default RecentAppointmentsCard;