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
// The flat tip narrows into the shaft over a short molded taper.
const TAPER_START = TIP_END - 5
export const ROD_START = TIP_END + 2
// Before layout is measured, a long rod reaches past the top of the page.
export const UNMEASURED_LENGTH = 4000
export const profiles = {
  rod: starProfile(36, 6, 0.22),
  tip: barProfile(2.9, 1.1, 0.3),
} as const
export type Section = keyof typeof profiles
export const SECTIONS = ['rod', 'tip'] as const
export const STRIPE_SAMPLES = 40

const f = (value: number) => value.toFixed(2)

/** The flat tip with rounded top corners, tapering from its own width into the shaft's. */
export function tipPath(left: number, right: number, rodLeft: number, rodRight: number) {
  const corner = Math.min(3, (right - left) / 2)
  const bend = (ROD_START - TAPER_START) / 2
  return [
    `M${f(left + corner)} ${TIP_START}`,
    `H${f(right - corner)}`,
    `Q${f(right)} ${TIP_START} ${f(right)} ${TIP_START + corner}`,
    `V${TAPER_START}`,
    `C${f(right)} ${TAPER_START + bend} ${f(rodRight)} ${ROD_START - bend} ${f(rodRight)} ${ROD_START}`,
    `H${f(rodLeft)}`,
    `C${f(rodLeft)} ${ROD_START - bend} ${f(left)} ${TAPER_START + bend} ${f(left)} ${TAPER_START}`,
    `V${TIP_START + corner}`,
    `Q${f(left)} ${TIP_START} ${f(left + corner)} ${TIP_START}`,
    'Z',
  ].join(' ')
}

/** The shaft, square where it leaves the taper and ending in a small bevel. */
export function rodPath(left: number, right: number, length: number) {
  const bevel = Math.min(2, (right - left) / 2)
  return [
    `M${f(left)} ${ROD_START}`,
    `H${f(right)}`,
    `V${f(length - bevel)}`,
    `Q${f(right)} ${f(length)} ${f(right - bevel)} ${f(length)}`,
    `H${f(left + bevel)}`,
    `Q${f(left)} ${f(length)} ${f(left)} ${f(length - bevel)}`,
    'Z',
  ].join(' ')
}

// The hook's curl, as [depth, height] points in its own plane: depth runs through the tip's
// face, toward the room. The wire comes down behind the tip, threads the hole at its top edge,
// where the wand's weight rests, and curls up in front.
const HOOK_REACH = 3.5
const HOOK_CURL: readonly (readonly [number, number])[] = bezierChain([
  [0, HOLE_Y - 10],
  [0, HOLE_Y - 7],
  [-HOOK_REACH, HOLE_Y - 6],
  [-HOOK_REACH, HOLE_Y - 3.5],
  [-HOOK_REACH, HOLE_Y - 1.5],
  [-HOOK_REACH * 0.4, HOLE_Y - 1],
  [0, HOLE_Y - 1],
  [HOOK_REACH * 0.5, HOLE_Y - 1],
  [HOOK_REACH, HOLE_Y - 1.5],
  [HOOK_REACH, HOLE_Y - 4.5],
])
// The curl is bent a little off the tip's normal, as real hooks are, so it never vanishes
// edge-on at rest.
const HOOK_BEND = 0.6

function bezierChain(points: readonly (readonly [number, number])[]) {
  const samples: [number, number][] = []
  for (let start = 0; start + 3 < points.length; start += 3) {
    const [a, b, c, d] = [points[start], points[start + 1], points[start + 2], points[start + 3]]
    if (!a || !b || !c || !d) break
    for (let step = start === 0 ? 0 : 1; step <= 8; step++) {
      const t = step / 8
      const u = 1 - t
      const weights = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const
      samples.push([
        weights[0] * a[0] + weights[1] * b[0] + weights[2] * c[0] + weights[3] * d[0],
        weights[0] * a[1] + weights[1] * b[1] + weights[2] * c[1] + weights[3] * d[1],
      ])
    }
  }
  return samples
}

/**
 * The wire hook through the tip's hole, turned with the wand. `back` runs behind the tip and
 * `front` in front of it; either can be empty.
 */
export function hookPaths(turn: number) {
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  const bendX = -Math.sin(HOOK_BEND)
  const bendZ = Math.cos(HOOK_BEND)
  let back = `M0 ${-PIVOT_ABOVE - 40} V${HOLE_Y - 10}`
  let front = ''
  let previous: { x: number; y: number; ahead: boolean } | null = null
  for (const [depth, y] of HOOK_CURL) {
    // In the wand's frame, then turned to face the viewer.
    const x = depth * bendX * cos - depth * bendZ * sin
    // Which side of the tip the point is on, and whether that side faces the room.
    const ahead = depth * bendZ * cos > 0
    const point = `${f(x)} ${f(y)}`
    if (previous && previous.ahead !== ahead) {
      // Both halves meet at the hole, so neither leaves a gap.
      const join = `${f(previous.x)} ${f(previous.y)}`
      if (ahead) front += ` M${join} L${point}`
      else back += ` M${join} L${point}`
    } else if (ahead) front += `${front ? ' L' : ' M'}${point}`
    else back += ` L${point}`
    previous = { x, y, ahead }
  }
  return { back, front }
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
