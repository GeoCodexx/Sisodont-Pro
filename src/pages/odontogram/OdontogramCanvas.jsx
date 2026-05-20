import { useTheme } from '@mui/material'
import ToothSVG from './ToothSVG'
import {
  ADULT_UPPER_RIGHT, ADULT_UPPER_LEFT, ADULT_LOWER_RIGHT, ADULT_LOWER_LEFT,
  CHILD_UPPER_RIGHT, CHILD_UPPER_LEFT, CHILD_LOWER_RIGHT, CHILD_LOWER_LEFT,
  getToothPosition, getSVGDimensions, TOOTH_SIZE_PX,
} from './odontogramConstants'
import { useOdontogramStore } from '../../stores/useOdontogramStore'

export default function OdontogramCanvas({ odontogramType = 'adult', onToothClick }) {
  const theme    = useTheme()
  const darkMode = theme.palette.mode === 'dark'
  const { data, selectedTooth } = useOdontogramStore()

  if (!data) return null

  const toothMap = Object.fromEntries(data.teeth.map(t => [t.number, t]))

  const isAdult = odontogramType === 'adult'

  const upperRow = isAdult
    ? [...ADULT_UPPER_RIGHT, ...ADULT_UPPER_LEFT]
    : [...CHILD_UPPER_RIGHT, ...CHILD_UPPER_LEFT]

  const lowerRow = isAdult
    ? [...ADULT_LOWER_RIGHT, ...ADULT_LOWER_LEFT]
    : [...CHILD_LOWER_RIGHT, ...CHILD_LOWER_LEFT]

  const { width: SVG_WIDTH, height: SVG_HEIGHT } = getSVGDimensions(odontogramType)
  const S = TOOTH_SIZE_PX
  const count = isAdult ? 16 : 10

  // Colores de cuadrantes para etiquetas
  const quadrantLabels = isAdult
    ? [
        { text: '18─11', x: 22,           y: 13, anchor: 'start' },
        { text: '21─28', x: SVG_WIDTH - 22, y: 13, anchor: 'end'   },
        { text: '48─41', x: 22,           y: SVG_HEIGHT - 4, anchor: 'start' },
        { text: '31─38', x: SVG_WIDTH - 22, y: SVG_HEIGHT - 4, anchor: 'end'   },
      ]
    : [
        { text: '55─51', x: 22,           y: 13, anchor: 'start' },
        { text: '61─65', x: SVG_WIDTH - 22, y: 13, anchor: 'end'   },
        { text: '85─81', x: 22,           y: SVG_HEIGHT - 4, anchor: 'start' },
        { text: '71─75', x: SVG_WIDTH - 22, y: SVG_HEIGHT - 4, anchor: 'end'   },
      ]

  const dividerX = SVG_WIDTH / 2
  const upperY   = 22
  const lowerY   = upperY + S + 52

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      style={{ width: '100%', maxWidth: SVG_WIDTH, display: 'block', margin: '0 auto' }}
    >
      {/* Etiquetas de cuadrantes */}
      {quadrantLabels.map(l => (
        <text key={l.text} x={l.x} y={l.y}
          textAnchor={l.anchor} fontSize={9}
          fill={darkMode ? '#555' : '#bbb'} fontFamily="monospace">
          {l.text}
        </text>
      ))}

      {/* Línea divisoria horizontal */}
      <line
        x1={22} y1={SVG_HEIGHT / 2}
        x2={SVG_WIDTH - 22} y2={SVG_HEIGHT / 2}
        stroke={darkMode ? '#3a3a3a' : '#e0e0e0'}
        strokeWidth={1} strokeDasharray="4 3"
      />

      {/* Línea divisoria vertical */}
      <line
        x1={dividerX} y1={16}
        x2={dividerX} y2={SVG_HEIGHT - 16}
        stroke={darkMode ? '#3a3a3a' : '#e0e0e0'}
        strokeWidth={1} strokeDasharray="4 3"
      />

      {/* Fila superior */}
      {upperRow.map((num, idx) => {
        const tooth = toothMap[num] ?? { number: num, faces: {}, absent: false, notes: '' }
        const pos   = getToothPosition(num, odontogramType)
        return (
          <g key={num}>
            {/* Número arriba */}
            <text
              x={pos.x + S / 2} y={pos.y - 4}
              textAnchor="middle" fontSize={9}
              fill={darkMode ? '#777' : '#aaa'} fontFamily="monospace"
            >
              {num}
            </text>
            <ToothSVG
              tooth={tooth}
              x={pos.x} y={pos.y}
              isSelected={selectedTooth === num}
              onClick={onToothClick}
              darkMode={darkMode}
            />
          </g>
        )
      })}

      {/* Fila inferior */}
      {lowerRow.map((num) => {
        const tooth = toothMap[num] ?? { number: num, faces: {}, absent: false, notes: '' }
        const pos   = getToothPosition(num, odontogramType)
        return (
          <g key={num}>
            <ToothSVG
              tooth={tooth}
              x={pos.x} y={pos.y}
              isSelected={selectedTooth === num}
              onClick={onToothClick}
              darkMode={darkMode}
            />
            {/* Número abajo */}
            <text
              x={pos.x + S / 2} y={pos.y + S + 10}
              textAnchor="middle" fontSize={9}
              fill={darkMode ? '#777' : '#aaa'} fontFamily="monospace"
            >
              {num}
            </text>
          </g>
        )
      })}
    </svg>
  )
}