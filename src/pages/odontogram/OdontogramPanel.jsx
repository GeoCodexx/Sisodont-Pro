import {
  Box,
  Typography,
  Chip,
  Divider,
  TextField,
  Button,
  Tooltip,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import { useOdontogramStore } from "../../stores/useOdontogramStore";

export default function OdontogramPanel({ readOnly }) {
  const {
    actions,
    selectedAction,
    selectAction,
    selectedTooth,
    data,
    toggleAbsent,
    clearTooth,
    setToothNote,
  } = useOdontogramStore();

  const tooth = data?.teeth?.find((t) => t.number === selectedTooth);
  const paintedFaces = tooth
    ? Object.entries(tooth.faces ?? {}).filter(([, v]) => v?.action)
    : [];

  const FACE_LABELS = {
    top: "Oclusal",
    bottom: "Lingual",
    left: "Mesial",
    right: "Distal",
    center: "Vestibular",
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Selector de acción */}
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          Acción activa
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {actions.map((a) => (
            <Chip
              key={a.name}
              label={a.name}
              size="small"
              onClick={() =>
                !readOnly &&
                selectAction(selectedAction === a.name ? null : a.name)
              }
              sx={{
                cursor: readOnly ? "default" : "pointer",
                bgcolor: selectedAction === a.name ? a.color : "transparent",
                color: selectedAction === a.name ? "#fff" : "text.primary",
                borderColor: a.color,
                border: "1.5px solid",
                fontWeight: selectedAction === a.name ? 600 : 400,
                "&:hover": readOnly ? {} : { bgcolor: a.color + "33" },
              }}
            />
          ))}
        </Box>
        {!readOnly && (
          <Typography
            variant="caption"
            color="text.secondary"
            mt={0.5}
            display="block"
          >
            {selectedAction
              ? `Clic en una cara del diente para aplicar "${selectedAction}". Clic nuevamente para quitar.`
              : "Selecciona una acción para comenzar."}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Detalle del diente seleccionado */}
      {tooth ? (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" fontWeight={500}>
              Diente {tooth.number}
              {tooth.absent && (
                <Chip
                  label="Ausente"
                  size="small"
                  color="error"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            {!readOnly && (
              <Box>
                <Tooltip
                  title={tooth.absent ? "Marcar presente" : "Marcar ausente"}
                >
                  <IconButton
                    size="small"
                    onClick={() => toggleAbsent(tooth.number)}
                  >
                    <BlockIcon
                      fontSize="small"
                      color={tooth.absent ? "error" : "inherit"}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Limpiar diente">
                  <IconButton
                    size="small"
                    onClick={() => clearTooth(tooth.number)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Caras con tratamiento */}
          {paintedFaces.length > 0 ? (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={0.5}
              >
                Caras tratadas
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {paintedFaces.map(([face, val]) => (
                  <Chip
                    key={face}
                    label={`${FACE_LABELS[face]}: ${val.action}`}
                    size="small"
                    sx={{
                      bgcolor: val.color + "22",
                      color: val.color,
                      borderColor: val.color,
                      border: "1px solid",
                      fontSize: 11,
                    }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            !tooth.absent && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={1.5}
              >
                Sin tratamientos registrados.
              </Typography>
            )
          )}

          {/* Notas del diente */}
          <TextField
            label="Notas del diente"
            value={tooth.notes ?? ""}
            onChange={(e) => setToothNote(tooth.number, e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={3}
            disabled={readOnly}
          />
        </Box>
      ) : (
        <Box sx={{ py: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Haz clic en un diente para ver su detalle.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
