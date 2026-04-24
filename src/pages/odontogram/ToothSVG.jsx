import { TOOTH_SIZE_PX } from './odontogramConstants'

const S  = TOOTH_SIZE_PX      // 34
const C  = S / 2              // 17 — centro
const IN = S * 0.15           // triángulo interior

// Cada cara es un polígono dentro del cuadrado S×S
// Coordenadas relativas al origen (x,y) del diente
const FACE_POLYGONS = {
  // top: triángulo superior
  top:    `${C},${C - IN}  ${S - IN},${IN}  ${IN},${IN}`,
  // bottom: triángulo inferior
  bottom: `${C},${C + IN}  ${IN},${S - IN}  ${S - IN},${S - IN}`,
  // left: triángulo izquierdo
  left:   `${C - IN},${C}  ${IN},${IN}  ${IN},${S - IN}`,
  // right: triángulo derecho
  right:  `${C + IN},${C}  ${S - IN},${IN}  ${S - IN},${S - IN}`,
  // center: rombo central
  center: `${C},${C - IN}  ${C + IN},${C}  ${C},${C + IN}  ${C - IN},${C}`,
}

export default function ToothSVG({
  tooth,
  x, y,
  isSelected,
  isActionSelected,
  onFaceClick,
  onToothClick,
  darkMode,
}) {
  const borderColor = isSelected
    ? '#534AB7'
    : darkMode ? '#555' : '#ccc'

  const bgColor = tooth.absent
    ? (darkMode ? '#1a1a1a' : '#f0f0f0')
    : (darkMode ? '#2a2a2a' : '#ffffff')

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onToothClick(tooth.number)}
    >
      {/* Fondo del diente */}
      <rect
        x={0} y={0}
        width={S} height={S}
        rx={3}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isSelected ? 2 : 0.5}
      />

      {/* Si el diente está ausente, mostrar X */}
      {tooth.absent ? (
        <>
          <line x1={4} y1={4} x2={S - 4} y2={S - 4} stroke={darkMode ? '#888' : '#aaa'} strokeWidth={1.5} />
          <line x1={S - 4} y1={4} x2={4} y2={S - 4} stroke={darkMode ? '#888' : '#aaa'} strokeWidth={1.5} />
        </>
      ) : (
        // Caras interactivas
        Object.entries(FACE_POLYGONS).map(([face, points]) => {
          const painted = tooth.faces?.[face]
          const fill    = painted?.color ?? 'transparent'
          const hoverFill = painted ? fill : (darkMode ? '#ffffff18' : '#0000000a')

          return (
            <polygon
              key={face}
              points={points}
              fill={fill}
              stroke={darkMode ? '#444' : '#ddd'}
              strokeWidth={0.9}
              style={{ cursor: isActionSelected ? 'crosshair' : 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                onFaceClick(tooth.number, face)
              }}
              onMouseEnter={e => {
                if (!painted) e.currentTarget.setAttribute('fill', hoverFill)
              }}
              onMouseLeave={e => {
                if (!painted) e.currentTarget.setAttribute('fill', 'transparent')
              }}
            />
          )
        })
      )}

      {/* Indicador de nota */}
      {tooth.notes && (
        <circle cx={S - 4} cy={4} r={3} fill="#534AB7" />
      )}
    </g>
  )
}