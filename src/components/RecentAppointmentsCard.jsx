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
    <Card
      variant="outlined"
      sx={{
        //borderRadius: 3,
        overflow: "hidden",
      }}
    >
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
            <Chip
              size="small"
              label={`${rows.length} registros`}
              variant="outlined"
            />
          )}
        </Box>

        {/* Empty */}
        {rows.length === 0 && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No hay citas registradas aún.
          </Typography>
        )}

        {/* MOBILE */}
        {isMobile && rows.length > 0 && (
          <Box>
            {rows.map((a, i) => (
              <Box key={a.id}>
                {i > 0 && <Divider sx={{ my: 1.5 }} />}

                <Box
                  onClick={() => navigate(`/patients/${a.patient_id}`)}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1.5,
                    cursor: "pointer",
                    borderRadius: 2,
                    p: 1,
                    transition: "0.2s",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  {/* Left */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      gap: 1.2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: 14,
                      }}
                    >
                      {a.patient_name?.[0] ?? "P"}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                        }}
                        noWrap
                      >
                        {a.patient_name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="textSecondary"
                        noWrap
                      >
                        {a.treatment_name ?? "—"}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: "block" }}
                      >
                        {a.doctor_name ?? "—"}
                      </Typography>

                      <Typography variant="caption" color="textSecondary">
                        {fmt(a.date)}
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
                      label={a.status}
                      color={STATUS_COLOR[a.status] ?? "default"}
                      size="small"
                      sx={{
                        textTransform: "capitalize",
                      }}
                    />

                    <Chip
                      size="small"
                      variant="outlined"
                      label={a.case_id ? "Multisesión" : "Única"}
                    />

                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      {a.case_id ? "—" : `S/ ${Number(a.total).toFixed(2)}`}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* DESKTOP */}
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
                <TableRow
                  key={a.id}
                  hover
                  onClick={() => navigate(`/patients/${a.patient_id}`)}
                  sx={{
                    cursor: "pointer",
                    transition: "0.15s",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  {/* Paciente */}
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      {/* <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 13,
                        }}
                      >
                        {a.patient_name?.[0] ?? "P"}
                      </Avatar> */}

                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {a.patient_name}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Tratamiento */}
                  <TableCell>
                    <Typography variant="body2">
                      {a.treatment_name ?? "—"}
                    </Typography>
                  </TableCell>

                  {/* Doctor */}
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {a.doctor_name ?? "—"}
                    </Typography>
                  </TableCell>

                  {/* Fecha */}
                  <TableCell>
                    <Typography variant="body2">{fmt(a.date)}</Typography>
                  </TableCell>

                  {/* Tipo */}
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined" //{a.case_id ? "filled" : "outlined"}
                      color={a.case_id ? "primary" : "default"}
                      label={a.case_id ? "Multisesión" : "Única"}
                    />
                  </TableCell>

                  {/* Costo */}
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      {a.case_id ? "—" : `S/ ${Number(a.total).toFixed(2)}`}
                    </Typography>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Chip
                      label={a.status}
                      color={STATUS_COLOR[a.status] ?? "default"}
                      size="small"
                      sx={{
                        textTransform: "capitalize",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Footer */}
        {rows.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
            }}
          >
            <Button
              size="small"
              endIcon={<OpenInNewIcon fontSize="small" />}
              onClick={() => navigate("/history")}
            >
              Ver historial completo
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
