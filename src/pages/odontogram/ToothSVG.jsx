import { TOOTH_SIZE_PX, FACE_LABELS } from "./odontogramConstants";

const S = TOOTH_SIZE_PX; // 44
const C = S / 2; // 22
const IN =  S * 0.16; //S * 0.22; // factor para triángulos

// Polígonos de las 5 caras — igual que antes para mostrar colores
const FACE_POLYGONS = {
  top: `${C},${C - IN}  ${S - IN},${IN}  ${IN},${IN}`,
  bottom: `${C},${C + IN}  ${IN},${S - IN}  ${S - IN},${S - IN}`,
  left: `${C - IN},${C}  ${IN},${IN}  ${IN},${S - IN}`,
  right: `${C + IN},${C}  ${S - IN},${IN}  ${S - IN},${S - IN}`,
  center: `${C},${C - IN}  ${C + IN},${C}  ${C},${C + IN}  ${C - IN},${C}`,
};

/**
 * Diente en el canvas principal.
 * En el nuevo flujo ya NO es clickeable por cara individual —
 * el click en cualquier parte del diente abre el modal ampliado.
 */
export default function ToothSVG({
  tooth,
  x,
  y,
  isSelected,
  onClick,
  darkMode,
}) {
  const borderColor = isSelected ? "#534AB7" : darkMode ? "#666" : "#bbb";

  const bgColor = tooth.absent
    ? darkMode
      ? "#1a1a1a"
      : "#efefef"
    : darkMode
      ? "#2a2a2a"
      : "#ffffff";

  const faceStroke = darkMode ? "#999" : "#bbb";

  // Determinar si el diente tiene algún tratamiento aplicado
  const hasTreatment = Object.keys(tooth.faces ?? {}).length > 0;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onClick ? () => onClick(tooth.number) : undefined}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Fondo clickeable — todo el cuadrado */}
      <rect
        x={0}
        y={0}
        width={S}
        height={S}
        rx={4}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth= {isSelected ? 3 : 1.4} //{isSelected ? 2.5 : 1}
      />

      {/* Diente ausente: X */}
      {tooth.absent ? (
        <>
          <line
            x1={6}
            y1={6}
            x2={S - 6}
            y2={S - 6}
            stroke={darkMode ? "#888" : "#aaa"}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <line
            x1={S - 6}
            y1={6}
            x2={6}
            y2={S - 6}
            stroke={darkMode ? "#888" : "#aaa"}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      ) : (
        /* Mostrar colores de caras pintadas — solo visual, no clickeable aquí */
        Object.entries(FACE_POLYGONS).map(([face, points]) => {
          const painted = tooth.faces?.[face];
          if (!painted)
            return (
              <polygon
                key={face}
                points={points}
                fill="transparent"
                stroke={faceStroke}
                strokeWidth= {1.4} //{0.8}
                strokeLinejoin="round"
              />
            );
          return (
            <polygon
              key={face}
              points={points}
              fill={painted.color}
              stroke={faceStroke}
              strokeWidth= {1.4} //{0.8}
              strokeLinejoin="round"
            />
          );
        })
      )}

      {/* Indicador de nota */}
      {tooth.notes && <circle cx={S - 8} cy={8} r={5} fill="#534AB7" /> /*<circle cx={S - 5} cy={5} r={4} fill="#534AB7" />*/}

      {/* Hover overlay — toda el área */}
      <rect
        x={0}
        y={0}
        width={S}
        height={S}
        rx={4}
        fill="transparent"
        stroke="transparent"
        style={{ pointerEvents: "all" }}
      />
    </g>
  );
}
