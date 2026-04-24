import { useTheme } from "@mui/material";
import ToothSVG from "./ToothSVG";
import {
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_LEFT,
  LOWER_RIGHT,
  getToothPosition,
  SVG_WIDTH,
  SVG_HEIGHT,
  TOOTH_SIZE_PX,
} from "./odontogramConstants";
import { useOdontogramStore } from "../../stores/useOdontogramStore";

const STEP = TOOTH_SIZE_PX + 4;

// Grupos de dientes con sus posiciones en el SVG
const ROWS = [
  { teeth: [...UPPER_RIGHT, ...UPPER_LEFT], label: "Superior" },
  { teeth: [...LOWER_RIGHT, ...LOWER_LEFT], label: "Inferior" },
];

export default function OdontogramCanvas({ readOnly }) {
  const theme = useTheme();
  const darkMode = theme.palette.mode === "dark";
  const { data, selectedTooth, selectedAction, selectTooth, paintFace } =
    useOdontogramStore();

  if (!data) return null;

  const toothMap = Object.fromEntries(data.teeth.map((t) => [t.number, t]));

  const handleFaceClick = (toothNumber, face) => {
    if (readOnly || !selectedAction) return;
    paintFace(toothNumber, face);
  };

  const handleToothClick = (toothNumber) => {
    selectTooth(toothNumber === selectedTooth ? null : toothNumber);
  };

  // Números de cuadrante para etiquetas
  /*const quadrantLabels = [
    { text: '18-11', x: 20,              y: 10, anchor: 'start'  },
    { text: '21-28', x: SVG_WIDTH - 20,  y: 10, anchor: 'end'    },
    { text: '48-41', x: 20,              y: SVG_HEIGHT - 6, anchor: 'start' },
    { text: '31-38', x: SVG_WIDTH - 20,  y: SVG_HEIGHT - 6, anchor: 'end'  },
  ]*/
  const quadrantLabels = [
    { text: "Cuadrante 1: [18-11]", x: 20, y: 10, anchor: "start" },
    { text: "Cuadrante 2: [21-28]", x: SVG_WIDTH - 20, y: 10, anchor: "end" },
    { text: "Cuadrante 4: [48-41]", x: 20, y: SVG_HEIGHT - 2, anchor: "start" },
    { text: "Cuadrante 3: [31-38]", x: SVG_WIDTH - 20, y: SVG_HEIGHT - 2, anchor: "end" },
  ];

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      style={{
        width: "100%",
        maxWidth: SVG_WIDTH,
        display: "block",
        //margin: "0 auto",
        margin: '20px auto' // ← añade aire externo también
      }}
    >
      {/* Etiquetas de cuadrantes */}
      {quadrantLabels.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          fontSize={14}
          fill={darkMode ? "#666" : "#aaa"}
          //fontFamily="monospace"
        >
          {l.text}
        </text>
      ))}

      {/* Línea divisoria central horizontal */}
      <line
        x1={20}
        y1={SVG_HEIGHT / 2}
        x2={SVG_WIDTH - 20}
        y2={SVG_HEIGHT / 2}
        stroke={darkMode ? "#444" : "#e0e0e0"}
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* Línea divisoria central vertical */}
      <line
        x1={SVG_WIDTH / 2}
        y1={14}
        x2={SVG_WIDTH / 2}
        y2={SVG_HEIGHT - 14}
        stroke={darkMode ? "#444" : "#e0e0e0"}
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* Dientes — fila superior */}
      {[...UPPER_RIGHT, ...UPPER_LEFT].map((num, idx) => {
        const tooth = toothMap[num] ?? {
          number: num,
          faces: {},
          absent: false,
        };
        const pos = getToothPosition(num);
        return (
          <g key={num}>
            {/* Número del diente arriba */}
            <text
              x={pos.x + TOOTH_SIZE_PX / 2}
              y={pos.y - 8} // antes -3
              textAnchor="middle"
              fontSize={16}
              fill={darkMode ? "#888" : "#999"}
              fontFamily="monospace"
            >
              {num}
            </text>
            <ToothSVG
              tooth={tooth}
              x={pos.x}
              y={pos.y}
              isSelected={selectedTooth === num}
              isActionSelected={!!selectedAction}
              onFaceClick={handleFaceClick}
              onToothClick={handleToothClick}
              darkMode={darkMode}
            />
          </g>
        );
      })}

      {/* Dientes — fila inferior */}
      {[...LOWER_RIGHT, ...LOWER_LEFT].map((num) => {
        const tooth = toothMap[num] ?? {
          number: num,
          faces: {},
          absent: false,
        };
        const pos = getToothPosition(num);
        return (
          <g key={num}>
            <ToothSVG
              tooth={tooth}
              x={pos.x}
              y={pos.y - 25}
              isSelected={selectedTooth === num}
              isActionSelected={!!selectedAction}
              onFaceClick={handleFaceClick}
              onToothClick={handleToothClick}
              darkMode={darkMode}
            />
            {/* Número del diente abajo */}
            <text
              x={pos.x + TOOTH_SIZE_PX / 2}
              y={pos.y + TOOTH_SIZE_PX - 5} // antes +10
              textAnchor="middle"
              fontSize={16}
              fill={darkMode ? "#888" : "#999"}
              fontFamily="monospace"
            >
              {num}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
