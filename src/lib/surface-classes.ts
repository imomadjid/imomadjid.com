export type SurfaceLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export function normalizeSurfaceLevel(value: number): SurfaceLevel {
  const level = Math.round(Math.max(1, Math.min(8, value)))
  switch (level) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      return level
    default:
      return 1
  }
}

export const SURFACE_BG = {
  1: 'bg-surface-1',
  2: 'bg-surface-2',
  3: 'bg-surface-3',
  4: 'bg-surface-4',
  5: 'bg-surface-5',
  6: 'bg-surface-6',
  7: 'bg-surface-7',
  8: 'bg-surface-8',
}

export const SURFACE_SHADOW = {
  1: 'shadow-surface-1',
  2: 'shadow-surface-2',
  3: 'shadow-surface-3',
  4: 'shadow-surface-4',
  5: 'shadow-surface-5',
  6: 'shadow-surface-6',
  7: 'shadow-surface-7',
  8: 'shadow-surface-8',
}

export const SURFACE_HOVER_BG = {
  1: 'hover:bg-surface-1',
  2: 'hover:bg-surface-2',
  3: 'hover:bg-surface-3',
  4: 'hover:bg-surface-4',
  5: 'hover:bg-surface-5',
  6: 'hover:bg-surface-6',
  7: 'hover:bg-surface-7',
  8: 'hover:bg-surface-8',
}

export const SURFACE_HOVER_SHADOW = {
  1: 'hover:shadow-surface-1',
  2: 'hover:shadow-surface-2',
  3: 'hover:shadow-surface-3',
  4: 'hover:shadow-surface-4',
  5: 'hover:shadow-surface-5',
  6: 'hover:shadow-surface-6',
  7: 'hover:shadow-surface-7',
  8: 'hover:shadow-surface-8',
}

export function surfaceClasses(bgLevel: number, shadowLevel: number = bgLevel): string {
  // Round after clamping so a fractional level can't index out of the lookup
  // tables (which would render "undefined undefined").
  const bg = normalizeSurfaceLevel(bgLevel)
  const shadow = normalizeSurfaceLevel(shadowLevel)
  return `${SURFACE_BG[bg]} ${SURFACE_SHADOW[shadow]}`
}

/** The hover half of `surfaceClasses`: the level a surface rises to while the
 *  pointer is on it. Same literal-lookup reason as above — `hover:bg-surface-`
 *  plus a template expression generates nothing. */
export function surfaceHoverClasses(bgLevel: number, shadowLevel: number = bgLevel): string {
  const bg = normalizeSurfaceLevel(bgLevel)
  const shadow = normalizeSurfaceLevel(shadowLevel)
  return `${SURFACE_HOVER_BG[bg]} ${SURFACE_HOVER_SHADOW[shadow]}`
}
