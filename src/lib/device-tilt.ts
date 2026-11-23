// Phone tilt for the Sunlit scene. The page is a wall in a small room: tilting the phone turns
// the room, blinds and branches with it, while the sun outside stays where it is. Shadows slide
// downhill, and casters farther from the wall slide farther, so the branches move past the
// blinds with real parallax.
//
// Gravity is the reference, read from `deviceorientation`. It cannot see a turn about the
// vertical axis, so a phone turned like a compass needle leaves the light alone. The resting
// pose re-centres slowly, so the effect answers changes in how the phone is held rather than
// the angle it is held at.

import { type Vec3, add, cross, dot, length, lerp, normalize, scale, sub } from './vec3'

export type TiltSettings = {
  /** Share of the phone's rotation passed to the light, 0 to 1. */
  influence: number
  /** Most the light turns, in degrees; larger turns ease into this limit. */
  range: number
  /** Seconds for a held pose to become the new rest. */
  recenter: number
}

const DEGREES = Math.PI / 180
// Turns smaller than this draw as no turn. The shader's `turn` uses the same cutoff.
const NO_TURN = 1e-6
// Smaller changes than this between frames, in radians, count as settled.
const SETTLED = 1e-5

/**
 * World up in the device's frame (x right, y toward the top of the device, z out of the
 * screen) from `deviceorientation` beta and gamma in degrees. Continuous through upright,
 * where gamma itself is unstable.
 */
export function upFromOrientation(beta: number, gamma: number): Vec3 {
  const b = beta * DEGREES
  const g = gamma * DEGREES
  return [-Math.sin(g) * Math.cos(b), Math.sin(b), Math.cos(g) * Math.cos(b)]
}

/** A device-frame vector in the screen's frame, for a screen turned `angle` degrees. */
export function toScreen([x, y, z]: Vec3, angle: number): Vec3 {
  const a = angle * DEGREES
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]
}

/**
 * Rodrigues rotation of `v` by the rotation vector `turn` (axis times angle in radians).
 * The shader's `turn` mirrors this.
 */
export function rotate(v: Vec3, turn: Vec3): Vec3 {
  const angle = length(turn)
  if (angle < NO_TURN) return v
  const k = scale(turn, 1 / angle)
  return add(
    add(scale(v, Math.cos(angle)), scale(cross(k, v), Math.sin(angle))),
    scale(k, dot(k, v) * (1 - Math.cos(angle))),
  )
}

/**
 * The light's position after the room turns by `tilt`, a rotation in the wall's frame. It
 * turns about the middle of the wall, where shadows sit still in place of sliding.
 */
export function tiltSource(source: Vec3, tilt: Vec3, aspect: number): Vec3 {
  const pivot: Vec3 = [-0.5 * aspect, 0.5, 0]
  return add(pivot, rotate(sub(source, pivot), tilt))
}

/**
 * The rotation that carries the resting pose to the current one, as the light sees it: in the
 * wall's frame (x right, y down, z toward the viewer), scaled by `influence` and eased into
 * `range`. Both poses are world up in the screen's frame (y toward the top of the screen).
 */
export function relativeTilt(rest: Vec3, current: Vec3, settings: TiltSettings): Vec3 {
  const axis = cross(rest, current)
  const sine = length(axis)
  if (sine < 1e-9 || settings.range <= 0) return [0, 0, 0]
  const angle = Math.atan2(sine, dot(rest, current))
  const limit = settings.range * DEGREES
  const eased = limit * Math.tanh((angle * settings.influence) / limit)
  const scale = eased / sine
  // The wall's y runs down the screen, which mirrors the rotation's x and z components.
  return [-axis[0] * scale, axis[1] * scale, -axis[2] * scale]
}

/**
 * Follows the phone's pose and eases the light's turn toward it, frame by frame. While
 * disabled (reduced motion, or no range or influence), the light rests and the current pose
 * stays the rest, so enabling it again starts from no turn.
 */
export function createTiltTracker() {
  let current: Vec3 | null = null
  let rest: Vec3 | null = null
  let target: Vec3 = [0, 0, 0]
  let tilt: Vec3 = [0, 0, 0]
  return {
    /**
     * A new reading of world up in the screen's frame. Returns whether it moved the pose
     * enough to redraw.
     */
    read(up: Vec3, enabled: boolean) {
      const next = normalize(up)
      const moved = !current || length(sub(next, current)) > SETTLED
      current = next
      if (!enabled || !rest) rest = current
      return enabled && moved
    },
    /** Start over from the next reading, with the light at rest. */
    reset() {
      current = rest = null
      target = tilt = [0, 0, 0]
    },
    /** Advance by `delta` seconds; returns the turn to draw, in the wall's frame. */
    step(delta: number, settings: TiltSettings, enabled: boolean): Vec3 {
      if (!enabled || !current || !rest) {
        rest = current
        target = tilt = [0, 0, 0]
        return tilt
      }
      rest = normalize(
        lerp(rest, current, 1 - Math.exp(-delta / Math.max(settings.recenter, 0.05))),
      )
      target = relativeTilt(rest, current, settings)
      // Sensor readings arrive unevenly; a short ease hides the steps between them.
      tilt = lerp(tilt, target, 1 - Math.exp(-delta * 10))
      if (length(sub(tilt, target)) < SETTLED) tilt = target
      return tilt
    },
    /** Whether the light is turned, or still turning back as the rest pose settles. */
    moving() {
      return length(tilt) > SETTLED || length(target) > SETTLED
    },
  }
}
