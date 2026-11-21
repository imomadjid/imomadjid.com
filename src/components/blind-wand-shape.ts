import { barProfile, starProfile } from './blind-wand-light'

// A blind's tilt wand, after the clear wands sold with horizontal blinds: a fluted star-shaped
// acrylic shaft with an integrated flat tip, hung by its hole on the tilter's wire hook.
// Turning it tilts the slats, so it switches the theme. The hook sits in the headrail above
// the page; lengths are CSS pixels along the wand from that pivot.
export const PIVOT_ABOVE = 14
export const TIP_START = 30
export const TIP_END = 54
export const HOLE_Y = 37
export const HOLE_RADIUS = 2.4
export const ROD_RADIUS = 4
export const ROD_START = TIP_END - 3
// Before layout is measured, a long rod reaches past the top of the page.
export const UNMEASURED_LENGTH = 4000
export const profiles = {
  rod: starProfile(36, 6, 0.22),
  tip: barProfile(2.9, 1.1, 0.3),
} as const
export type Section = keyof typeof profiles
export const SECTIONS = ['rod', 'tip'] as const
export const STRIPE_SAMPLES = 40

/** The wire hook through the tip's hole. Its loop turns with the wand, edge-on at rest. */
export function hookPath(turn: number) {
  const side = Math.sin(turn) * 5
  const bottom = HOLE_Y + 4
  return [
    `M0 ${-PIVOT_ABOVE - 40}`,
    `V${HOLE_Y - 1}`,
    `Q0 ${bottom} ${(side * 0.5).toFixed(2)} ${bottom}`,
    `T${side.toFixed(2)} ${HOLE_Y - 4}`,
  ].join(' ')
}

export function wandIds(id: string) {
  return {
    stripes: `${id}-stripes`,
    shade: `${id}-shade`,
    lit: `${id}-lit`,
    hole: `${id}-hole`,
    gradient: (section: Section, layer: 'base' | 'light') => `${id}-${section}-${layer}`,
  }
}
