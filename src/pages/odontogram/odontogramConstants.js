// ============================================================
// Numeración dental — Sistema FDI (Fédération Dentaire Internationale)
// Cuadrante 1: superior derecho (11–18)
// Cuadrante 2: superior izquierdo (21–28)
// Cuadrante 3: inferior izquierdo (31–38)
// Cuadrante 4: inferior derecho (41–48)
// ============================================================

export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
export const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28]
export const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38]
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]

export const ALL_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT]

// Caras de cada diente
// top=oclusal/incisal, left=mesial, right=distal, bottom=lingual/palatino, center=vestibular
export const FACES = ['top', 'right', 'bottom', 'left', 'center']

// Estructura vacía de un diente
export const emptyTooth = (number) => ({
  number,
  faces: {},        // { top: { action: 'Caries', color: '#FF4444' }, ... }
  notes: '',
  absent: false,    // true si fue extraído o no erupcionó
})

// Generar estado inicial con todos los dientes vacíos
export const initialOdontogramData = () => ({
  teeth: ALL_TEETH.map(emptyTooth),
})

// ============================================================
// Layout SVG — coordenadas (cx, cy) de cada diente
// Diente ocupa 36x36px, separación 4px → paso = 40px
// ============================================================
const TOOTH_SIZE  = 68   // tamaño del cuadrado de cada diente
const GAP         = 4    // separación entre dientes
const STEP        = TOOTH_SIZE + GAP
const START_X     = 20
const UPPER_Y     = 50 //20
const LOWER_Y     = UPPER_Y + TOOTH_SIZE + 48  // 48px de separación vertical

export const TOOTH_SIZE_PX = TOOTH_SIZE

export function getToothPosition(number) {
  const upperRow = [...UPPER_RIGHT, ...UPPER_LEFT]
  const lowerRow = [...LOWER_RIGHT].reverse().concat([...LOWER_LEFT].reverse())

  // Para fila superior: UPPER_RIGHT va de derecha a izquierda, UPPER_LEFT de izq a der
  const upperIdx = upperRow.indexOf(number)
  if (upperIdx !== -1) {
    return { x: START_X + upperIdx * STEP, y: UPPER_Y }
  }

  // Para fila inferior: espejada respecto a la superior
  const lowerOrder = [...LOWER_RIGHT, ...LOWER_LEFT]  // 48,47...41,31,32...38
  const lowerIdx = lowerOrder.indexOf(number)
  if (lowerIdx !== -1) {
    return { x: START_X + lowerIdx * STEP, y: LOWER_Y }
  }

  return { x: 0, y: 0 }
}

export const SVG_WIDTH  = START_X * 2 + 16 * STEP - GAP
export const SVG_HEIGHT = LOWER_Y + TOOTH_SIZE + START_X

// Colores por defecto de acciones (fallback si no carga de BD)
export const DEFAULT_ACTIONS = [
  { name: 'Caries',     color: '#FF4444' },
  { name: 'Obturación', color: '#4444FF' },
  { name: 'Corona',     color: '#FFD700' },
  { name: 'Extracción', color: '#222222' },
  { name: 'Implante',   color: '#00AA44' },
  { name: 'Endodoncia', color: '#FF8800' },
  { name: 'Fractura',   color: '#AA0000' },
  { name: 'Sano',       color: '#CCCCCC' },
]