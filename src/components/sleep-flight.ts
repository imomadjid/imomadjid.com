import { smoothStep } from '#/lib/ambient-transition'

// The sleep Z's, breath by breath. Each exhale lets out two or three Z's, a few hundred ms apart,
// along one heading up and to the right of the head. Each floats out quickly, slows as it rises,
// sways a little, leaning into its drift as a leaf does, grows as it goes, and dissolves near the
// top. The first of a breath floats farthest, so a breath settles into the classic "zzZ": small
// by the head, larger away from it. Positions are px from the avatar's centre, y down.

export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export type SleepFlight = {
  /** When it leaves the head (performance.now() ms) and how long it floats. */
  start: number
  duration: number
  originX: number
  originY: number
  /** Degrees right of straight up. */
  heading: number
  /** How far it floats along its heading. */
  distance: number
  size: number
  /** Sideways sway, px either way (its sign sets which way it starts), and how many swings. */
  sway: number
  swayCycles: number
  /** Its resting lean, degrees. */
  tilt: number
}

/** The breath's rhythm: a breath every 4.8 to 5.8 s, slower than waking breath. */
export const breathPeriod = { min: 4800, max: 5800 }

/** One exhale's Z's, the first leaving at `start`. */
export function createBreath(start: number): SleepFlight[] {
  const count = Math.random() < 0.25 ? 2 : 3
  const heading = randomBetween(18, 50)
  const originX = randomBetween(7, 10)
  const originY = randomBetween(-12, -9)
  // Where the nearest comes to rest, clear of the photo, and the gap between their resting
  // places, a little more than a Z is wide at its largest.
  const nearest = randomBetween(22, 28)
  const spacing = randomBetween(16.5, 19)
  // One breath is one puff of air: its Z's sway the same way, at about the same pace.
  const swaySide = Math.random() < 0.5 ? -1 : 1
  const swayCycles = randomBetween(0.75, 1.25)
  let leaves = start
  return Array.from({ length: count }, (_, index) => {
    if (index) leaves += randomBetween(650, 800)
    return {
      start: leaves,
      duration: randomBetween(4200, 5000),
      originX: originX + randomBetween(-1, 1),
      originY: originY + randomBetween(-1, 1),
      heading: heading + randomBetween(-2.5, 2.5),
      distance: nearest + (count - 1 - index) * spacing + randomBetween(-0.5, 0.5),
      size: randomBetween(0.94, 1.02),
      sway: randomBetween(2.5, 4.5) * swaySide,
      swayCycles: swayCycles + randomBetween(-0.08, 0.08),
      tilt: randomBetween(-6, 10),
    }
  })
}

// Along its heading it covers most of its way quickly out of the head, then keeps creeping, so it
// never stops dead. Normalised to cover `distance` at the end.
const travelOf = (progress: number) => 0.88 * (1 - (1 - progress) ** 2.4) + 0.12 * progress
const travelRateOf = (progress: number) => 0.88 * 2.4 * (1 - progress) ** 1.4 + 0.12

/** The most it leans into its sway, degrees, approached softly. */
export const maxBank = 14

export function flightPose(flight: SleepFlight, progress: number) {
  const { originX, originY, heading, distance, size, sway, swayCycles, tilt } = flight
  const angle = (heading * Math.PI) / 180
  const along = distance * travelOf(progress)
  // The sway grows in as it leaves the head.
  // A shorter flight sways less, in proportion, so the nearest Z doesn't wander more than it rises.
  const reach = sway * Math.min(1, distance / 50) * smoothStep(progress / 0.35)
  const phase = 2 * Math.PI * swayCycles * progress
  const aside = reach * Math.sin(phase)
  const x = originX + Math.sin(angle) * along + Math.cos(angle) * aside
  const y = originY - Math.cos(angle) * along + Math.sin(angle) * aside

  // Lean into the sideways drift, by half the angle of its way, eased into the limit so it never
  // pins there and flips.
  const asideRate = reach * 2 * Math.PI * swayCycles * Math.cos(phase)
  const drift = (Math.atan2(asideRate, distance * travelRateOf(progress)) * 180) / Math.PI
  const rotation = tilt + 0.25 * heading + maxBank * Math.tanh((0.5 * drift) / maxBank)

  const emerge = smoothStep(progress / 0.18)
  const dissolve = smoothStep((progress - 0.62) / 0.38)
  const blur = 4 * (1 - emerge) + 3 * dissolve
  return {
    x,
    y,
    rotation,
    // It grows with how far it has floated, so the farthest of a breath is the largest: zzZ.
    scale: size * (0.3 + 0.7 * emerge) * (0.7 + 0.5 * Math.min(1, along / 60)),
    opacity: smoothStep(progress / 0.14) * (1 - dissolve),
    blur,
    /** How much of its ring shows: none while it's out of focus, so a blurred ring isn't a haze. */
    ring: Math.max(0, Math.min(1, 1 - blur / 2.5)),
  }
}
