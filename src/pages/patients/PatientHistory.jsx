import { useEffect, useState, memo, useMemo } from "react";
import {
  Box, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
} from "@mui/material";
import { useAppointmentStore } from "../../stores/useAppointmentStore";

// ─────────────────────────────────────────────────────────────
// Constantes fuera del componente
// ─────────────────────────────────────────────────────────────
const STATUS_COLOR = { pendiente: "warning", atendido: "success", cancelado: "error" };

// Instancia única del formatter — evita crear Intl en cada render
const dtFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});

const solesFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
});

const fmtDT   = (iso) => (iso ? dtFormatter.format(new Date(iso)) : "—");
const fmtSoles = (n)  => `S/ ${solesFormatter.format(Number(n))}`;

// ─────────────────────────────────────────────────────────────
// HistoryRow — memoizado para que cambios de estado en el padre
// (ej. nuevas filas al re-fetch) no re-rendericen filas que
// no cambiaron
// ─────────────────────────────────────────────────────────────
const HistoryRow = memo(function HistoryRow({ appt }) {
  // Calcular valores derivados una sola vez por row
  const date  = useMemo(() => fmtDT(appt.date),           [appt.date]);
  const total = useMemo(() => fmtSoles(appt.total ?? 0),  [appt.total]);
  const paid  = useMemo(() => fmtSoles(appt.paid  ?? 0),  [appt.paid]);

  return (
    <TableRow hover>
      <TableCell>{date}</TableCell>
      <TableCell>{appt.treatment_name ?? "—"}</TableCell>
      <TableCell>{appt.doctor_name    ?? "—"}</TableCell>
      <TableCell>{total}</TableCell>
      <TableCell>{paid}</TableCell>
      <TableCell>
        <Chip
          label={appt.status}
          color={STATUS_COLOR[appt.status] ?? "default"}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      </TableCell>
    </TableRow>
  );
});

// ─────────────────────────────────────────────────────────────
// PatientHistory
// ─────────────────────────────────────────────────────────────
export default function PatientHistory({ patientId }) {
  const { fetchByPatient } = useAppointmentStore();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchByPatient(patientId).then((data) => {
      if (!cancelled) {
        setRows(data ?? []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [patientId, fetchByPatient]);

  if (loading) return <CircularProgress size={20} />;

  if (rows.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        Este paciente no tiene citas registradas.
      </Typography>
    );

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Tratamiento</TableCell>
            <TableCell>Doctor</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Pagado</TableCell>
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((a) => (
            <HistoryRow key={a.id} appt={a} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}