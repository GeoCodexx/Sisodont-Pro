// ============================================================
// Sistema FDI — Dentición permanente (adulto)
// ============================================================
export const ADULT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
export const ADULT_UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28]
export const ADULT_LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38]
export const ADULT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
export const ADULT_TEETH = [
  ...ADULT_UPPER_RIGHT, ...ADULT_UPPER_LEFT,
  ...ADULT_LOWER_LEFT,  ...ADULT_LOWER_RIGHT,
]

// ============================================================
// Sistema FDI — Dentición temporal (niño)
// ============================================================
export const CHILD_UPPER_RIGHT = [55, 54, 53, 52, 51]
export const CHILD_UPPER_LEFT  = [61, 62, 63, 64, 65]
export const CHILD_LOWER_LEFT  = [71, 72, 73, 74, 75]
export const CHILD_LOWER_RIGHT = [85, 84, 83, 82, 81]
export const CHILD_TEETH = [
  ...CHILD_UPPER_RIGHT, ...CHILD_UPPER_LEFT,
  ...CHILD_LOWER_LEFT,  ...CHILD_LOWER_RIGHT,
]

// Aliases para compatibilidad
export const UPPER_RIGHT = ADULT_UPPER_RIGHT
export const UPPER_LEFT  = ADULT_UPPER_LEFT
export const LOWER_LEFT  = ADULT_LOWER_LEFT
export const LOWER_RIGHT = ADULT_LOWER_RIGHT
export const ALL_TEETH   = ADULT_TEETH

// Caras
export const FACES = ['top', 'right', 'bottom', 'left', 'center']
export const FACE_LABELS = {
  top:    'Oclusal / Incisal',
  bottom: 'Lingual / Palatino',
  left:   'Mesial',
  right:  'Distal',
  center: 'Vestibular',
}

export const emptyTooth = (number) => ({
  number, faces: {}, notes: '', absent: false,
})

export const initialOdontogramData = (type = 'adult') => ({
  teeth: (type === 'child' ? CHILD_TEETH : ADULT_TEETH).map(emptyTooth),
})

// Layout SVG
const TOOTH_SIZE = 44
const GAP        = 5
const STEP       = TOOTH_SIZE + GAP
const START_X    = 20
const UPPER_Y    = 22
const LOWER_Y    = UPPER_Y + TOOTH_SIZE + 52

export const TOOTH_SIZE_PX = TOOTH_SIZE

export function getToothPosition(number, type = 'adult') {
  const rows = type === 'adult'
    ? {
        upper: [...ADULT_UPPER_RIGHT, ...ADULT_UPPER_LEFT],
        lower: [...ADULT_LOWER_RIGHT, ...ADULT_LOWER_LEFT],
      }
    : {
        upper: [...CHILD_UPPER_RIGHT, ...CHILD_UPPER_LEFT],
        lower: [...CHILD_LOWER_RIGHT, ...CHILD_LOWER_LEFT],
      }

  const ui = rows.upper.indexOf(number)
  if (ui !== -1) return { x: START_X + ui * STEP, y: UPPER_Y }
  const li = rows.lower.indexOf(number)
  if (li !== -1) return { x: START_X + li * STEP, y: LOWER_Y }
  return { x: 0, y: 0 }
}

export function getSVGDimensions(type = 'adult') {
  const count = type === 'adult' ? 16 : 10
  return {
    width:  START_X * 2 + count * STEP - GAP,
    height: LOWER_Y + TOOTH_SIZE + START_X + 12,
  }
}

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