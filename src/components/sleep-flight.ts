import { smoothStep } from '#/lib/ambient-transition'

// The sleep Z's: a steady stream, as the familiar sleeping "zzz" is. One Z leaves the head every
// 1.6 to 1.9 s and floats up and to the right along the sleep's one path, drifting a little slower
// as it rises, swaying and leaning into its drift as a leaf does, growing all the way, and fading
// near the top. Each lives about two and a half intervals, so two or three are always out, the
// older ones higher and larger: the stream itself reads zzZ. Measured against sleeping animations
// on LottieFiles (steady streams 0.5 to 1.2 s apart, paths 0 to 27° off vertical, near-even speed,
// growth over the whole life). Positions are px from the avatar's centre, y down.

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
  /** Sideways sway, px either way (its sign sets which way it starts), how many swings, and where
   *  in its swing it starts. */
  sway: number
  swayCycles: number
  swayPhase: number
  /** Its resting lean, degrees. */
  tilt: number
}

/** The gap between one Z leaving the head and the next, ms. */
export const emitEvery = { min: 1600, max: 1900 }

/** One sleep's path, the same for every Z while it lasts. */
export type SleepStream = {
  heading: number
  originX: number
  originY: number
  distance: number
  duration: number
}

export function createStream(): SleepStream {
  return {
    heading: randomBetween(20, 30),
    originX: randomBetween(7, 10),
    originY: randomBetween(-12, -9),
    distance: randomBetween(52, 58),
    duration: randomBetween(4300, 4700),
  }
}

/** The next Z along the stream, leaving the head at `start`. */
export function createFlight(stream: SleepStream, start: number): SleepFlight {
  return {
    start,
    // Small differences only, so a Z never gains on the one ahead of it.
    duration: stream.duration * randomBetween(0.98, 1.02),
    originX: stream.originX + randomBetween(-0.5, 0.5),
    originY: stream.originY + randomBetween(-0.5, 0.5),
    heading: stream.heading + randomBetween(-3, 3),
    distance: stream.distance + randomBetween(-1.5, 1.5),
    size: randomBetween(0.94, 1.02),
    sway: randomBetween(2.5, 4.5) * (Math.random() < 0.5 ? -1 : 1),
    swayCycles: randomBetween(0.75, 1.25),
    swayPhase: randomBetween(0, 2 * Math.PI),
    tilt: randomBetween(-6, 10),
  }
}

// Along its heading it drifts a little slower as it rises (about 1.7 times as fast in its first
// third as in its last), so it never darts out and hovers.
const travelOf = (progress: number) => 1 - (1 - progress) ** 1.3
const travelRateOf = (progress: number) => 1.3 * (1 - progress) ** 0.3

/** The most it leans into its sway, degrees, approached softly. */
export const maxBank = 14

export function flightPose(flight: SleepFlight, progress: number) {
  const { originX, originY, heading, distance, size, sway, swayCycles, swayPhase, tilt } = flight
  const angle = (heading * Math.PI) / 180
  const travel = travelOf(progress)
  const along = distance * travel
  // The sway grows in as it leaves the head, so it starts on its path whatever its phase.
  const reach = sway * smoothStep(progress / 0.35)
  const phase = swayPhase + 2 * Math.PI * swayCycles * progress
  const aside = reach * (Math.sin(phase) - Math.sin(swayPhase))
  const x = originX + Math.sin(angle) * along + Math.cos(angle) * aside
  const y = originY - Math.cos(angle) * along + Math.sin(angle) * aside

  // Lean into the sideways drift, by half the angle of its way, eased into the limit so it never
  // pins there and flips.
  const asideRate = reach * 2 * Math.PI * swayCycles * Math.cos(phase)
  const drift = (Math.atan2(asideRate, distance * travelRateOf(progress)) * 180) / Math.PI
  const rotation = tilt + 0.25 * heading + maxBank * Math.tanh((0.5 * drift) / maxBank)

  // A quick pop out of the head, then steady growth the whole way up, and a short fade at the top.
  const pop = smoothStep(progress / 0.1)
  const fade = smoothStep((progress - 0.78) / 0.22)
  const blur = 2.5 * (1 - pop) + 1.5 * fade
  return {
    x,
    y,
    rotation,
    scale: size * (0.6 + 0.4 * pop) * (0.8 + 0.4 * travel),
    opacity: pop * (1 - fade),
    blur,
    /** How much of its ring shows: none while it's out of focus, so a blurred ring isn't a haze. */
    ring: Math.max(0, Math.min(1, 1 - blur / 1.5)),
  }
}
