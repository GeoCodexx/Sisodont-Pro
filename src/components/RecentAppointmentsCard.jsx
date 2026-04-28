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
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useBreakpoint } from "../hooks/useBreakpoint";

const STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};

export default function RecentAppointmentsCard({ rows }) {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleString("es-PE", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 2 }}>
          Últimas citas
        </Typography>

        {rows.length === 0 && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No hay citas registradas aún.
          </Typography>
        )}

        {/* Vista móvil: lista compacta */}
        {isMobile && rows.length > 0 && (
          <Box>
            {rows.map((a, i) => (
              <Box key={a.id}>
                {i > 0 && <Divider sx={{ my: 1 }} />}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                  onClick={() => navigate(`/patients/${a.patient_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                      {a.patient_name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      {a.treatment_name ?? "—"} · {fmt(a.date)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {a.doctor_name ?? "—"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 0.5,
                      ml: 1,
                    }}
                  >
                    <Chip
                      label={a.status}
                      color={STATUS_COLOR[a.status] ?? "default"}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      S/ {Number(a.total).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Vista desktop: tabla */}
        {!isMobile && rows.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Tratamiento</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((a) => (
                <TableRow
                  key={a.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/patients/${a.patient_id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {a.patient_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {a.treatment_name ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {a.doctor_name ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{fmt(a.date)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      S/ {Number(a.total).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.status}
                      color={STATUS_COLOR[a.status] ?? "default"}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {rows.length > 0 && (
          <Button
            size="small"
            sx={{ mt: 1.5 }}
            endIcon={<OpenInNewIcon fontSize="small" />}
            onClick={() => navigate("/history")}
          >
            Ver historial completo
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
