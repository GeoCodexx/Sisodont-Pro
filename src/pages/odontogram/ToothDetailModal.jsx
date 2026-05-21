import { useState, useEffect } from "react";
import {
  Dialog,
  Drawer,
  Box,
  Typography,
  Chip,
  Button,
  TextField,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import { FACE_LABELS } from "./odontogramConstants";
import { useOdontogramStore } from "../../stores/useOdontogramStore";

// ── Tamaño del diente ampliado ────────────────────────────────
const BIG = 220; // tamaño total del diente en el modal
const BC = BIG / 2;
const BIN = BIG * 0.18; // factor triángulos

const BIG_POLYGONS = {
  top: `${BC},${BC - BIN}  ${BIG - BIN},${BIN}  ${BIN},${BIN}`,
  bottom: `${BC},${BC + BIN}  ${BIN},${BIG - BIN}  ${BIG - BIN},${BIG - BIN}`,
  left: `${BC - BIN},${BC}  ${BIN},${BIN}  ${BIN},${BIG - BIN}`,
  right: `${BC + BIN},${BC}  ${BIG - BIN},${BIN}  ${BIG - BIN},${BIG - BIN}`,
  center: `${BC},${BC - BIN}  ${BC + BIN},${BC}  ${BC},${BC + BIN}  ${BC - BIN},${BC}`,
};

// Etiquetas de posición de las caras en el SVG
const FACE_LABEL_POSITIONS = {
  top: { x: BC, y: BIN / 2 + 4, anchor: "middle" },
  bottom: { x: BC, y: BIG - BIN / 2 + 4, anchor: "middle" },
  left: { x: BIN / 2, y: BC + 4, anchor: "middle" },
  right: { x: BIG - BIN / 2, y: BC + 4, anchor: "middle" },
  center: { x: BC, y: BC + 4, anchor: "middle" },
};

const FACE_SHORT = {
  top: "Oclusal",
  bottom: "Lingual",
  left: "Mesial",
  right: "Distal",
  center: "Vestib.",
};

// ── SVG del diente ampliado ───────────────────────────────────
function BigToothSVG({
  tooth,
  selectedAction,
  actions,
  onFacePaint,
  darkMode,
}) {
  const [hovered, setHovered] = useState(null);

  const bgColor = tooth.absent
    ? darkMode
      ? "#1a1a1a"
      : "#efefef"
    : darkMode
      ? "#2a2a2a"
      : "#fafafa";
  const faceStroke = darkMode ? "#888" : "#bbb";
  const labelColor = darkMode ? "#aaa" : "#666";

  const actionMeta = actions.find((a) => a.name === selectedAction);
  const hoverColor = actionMeta
    ? actionMeta.color + "55"
    : darkMode
      ? "#ffffff22"
      : "#00000010";

  return (
    <svg
      viewBox={`0 0 ${BIG} ${BIG}`}
      width={BIG}
      height={BIG}
      style={{ display: "block", margin: "0 auto" }}
    >
      {/* Fondo */}
      <rect
        x={0}
        y={0}
        width={BIG}
        height={BIG}
        rx={10}
        fill={bgColor}
        stroke={darkMode ? "#555" : "#ccc"}
        strokeWidth={1.5}
      />

      {tooth.absent ? (
        <>
          <line
            x1={20}
            y1={20}
            x2={BIG - 20}
            y2={BIG - 20}
            stroke={darkMode ? "#666" : "#bbb"}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <line
            x1={BIG - 20}
            y1={20}
            x2={20}
            y2={BIG - 20}
            stroke={darkMode ? "#666" : "#bbb"}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <text
            x={BC}
            y={BC + 20}
            textAnchor="middle"
            fontSize={14}
            fill={darkMode ? "#666" : "#aaa"}
          >
            Diente ausente
          </text>
        </>
      ) : (
        Object.entries(BIG_POLYGONS).map(([face, points]) => {
          const painted = tooth.faces?.[face];
          const isHov = hovered === face;
          const fill = painted?.color ?? (isHov ? hoverColor : "transparent");

          const lp = FACE_LABEL_POSITIONS[face];

          return (
            <g key={face}>
              <polygon
                points={points}
                fill={fill}
                stroke={faceStroke}
                strokeWidth={1.2}
                strokeLinejoin="round"
                style={{
                  cursor: selectedAction ? "crosshair" : "pointer",
                  transition: "fill 0.1s",
                }}
                onClick={() => onFacePaint(face)}
                onMouseEnter={() => setHovered(face)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* Etiqueta de la cara */}
              <text
                x={lp.x}
                y={lp.y}
                textAnchor={lp.anchor}
                fontSize={12}
                fill={painted ? "#fff" : labelColor}
                style={{ pointerEvents: "none", userSelect: "none" }}
                fontWeight={painted ? 600 : 400}
              >
                {FACE_SHORT[face]}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

// ── Modal / Drawer principal ──────────────────────────────────
export default function ToothDetailModal({
  open,
  toothNumber,
  onClose,
  readOnly,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const darkMode = theme.palette.mode === "dark";

  const {
    data,
    actions,
    paintFace,
    toggleAbsent,
    clearTooth,
    setToothNote,
    selectedAction,
    selectAction,
  } = useOdontogramStore();

  const tooth = data?.teeth?.find((t) => t.number === toothNumber);
  const [localNote, setLocalNote] = useState("");

  useEffect(() => {
    if (tooth) setLocalNote(tooth.notes ?? "");
  }, [toothNumber, open]);

  if (!tooth) return null;

  const paintedFaces = Object.entries(tooth.faces ?? {}).filter(
    ([, v]) => v?.action,
  );

  const handleFacePaint = (face) => {
    if (readOnly || !selectedAction) return;
    paintFace(tooth.number, face);
  };

  const handleNoteBlur = () => {
    setToothNote(tooth.number, localNote);
  };

  const content = (
    <Box
      sx={{
        p: { xs: 2.5, sm: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={500}>
            Diente {toothNumber}
          </Typography>
          {tooth.absent && (
            <Chip label="Ausente" size="small" color="error" sx={{ mt: 0.5 }} />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {!readOnly && (
            <>
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
            </>
          )}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* SVG ampliado del diente */}
      <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
        <BigToothSVG
          tooth={tooth}
          selectedAction={selectedAction}
          actions={actions}
          onFacePaint={handleFacePaint}
          darkMode={darkMode}
        />
      </Box>

      {!readOnly && !tooth.absent && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            display: "block",
            mt: -1,
          }}
        >
          {selectedAction
            ? `Haz clic en la cara que quieres aplicar "${selectedAction}". Clic nuevamente para quitar.`
            : "Selecciona una acción abajo y luego toca la cara del diente."}
        </Typography>
      )}

      <Divider />

      {/* Selector de acciones */}
      {!readOnly && !tooth.absent && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              display: "block",
              mb: 1,
            }}
          >
            ACCIÓN ACTIVA
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {actions.map((a) => (
              <Chip
                key={a.name}
                label={a.name}
                size="small"
                onClick={() =>
                  selectAction(selectedAction === a.name ? null : a.name)
                }
                sx={{
                  cursor: "pointer",
                  bgcolor: selectedAction === a.name ? a.color : "transparent",
                  color: selectedAction === a.name ? "#fff" : "text.primary",
                  borderColor: a.color,
                  border: "1.5px solid",
                  fontWeight: selectedAction === a.name ? 600 : 400,
                  "&:hover": { bgcolor: a.color + "33" },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Caras pintadas */}
      {paintedFaces.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              display: "block",
              mb: 1,
            }}
          >
            CARAS CON TRATAMIENTO
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {paintedFaces.map(([face, val]) => (
              <Chip
                key={face}
                label={`${FACE_SHORT[face]}: ${val.action}`}
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
      )}

      {/* Notas */}
      <TextField
        label="Notas del diente"
        value={localNote}
        onChange={(e) => setLocalNote(e.target.value)}
        onBlur={handleNoteBlur}
        size="small"
        fullWidth
        multiline
        rows={2}
        disabled={readOnly}
        placeholder="Observaciones, diagnóstico..."
      />

      {/* Botón cerrar en móvil */}
      {isMobile && (
        <Button
          variant="contained"
          fullWidth
          onClick={onClose}
          sx={{ mt: "auto" }}
        >
          Listo
        </Button>
      )}
    </Box>
  );

  // Bottom sheet en móvil, Dialog en desktop
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        /*PaperProps={{
          sx: {
            borderRadius: "16px 16px 0 0",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        }}*/
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px 16px 0 0",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5 }}>
          <Box
            sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }}
          />
        </Box>
        {content}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      //PaperProps={{ sx: { maxHeight: "90vh" } }}
      slotProps={{
        paper: {
          sx: { maxHeight: "90vh" },
        },
      }}
    >
      {content}
    </Dialog>
  );
}
