// Phone tilt for the Sunlit scene. The page is a wall in a small room: tilting the phone turns
// the room, blinds and branches with it, while the sun outside stays where it is. Shadows slide
// downhill, and casters farther from the wall slide farther, so the branches move past the
// blinds with real parallax.
//
// Gravity is the reference, read from `deviceorientation`. It cannot see a turn about the
// vertical axis, so a phone turned like a compass needle leaves the light alone. The resting
// pose re-centres slowly, so the effect answers changes in how the phone is held rather than
// the angle it is held at.

export type Vec3 = [number, number, number]

export type TiltSettings = {
  /** Share of the phone's rotation passed to the light, 0 to 1. */
  influence: number
  /** Most the light turns, in degrees; larger turns ease into this limit. */
  range: number
  /** Seconds for a held pose to become the new rest. */
  recenter: number
}

const DEGREES = Math.PI / 180

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
function normalize(a: Vec3): Vec3 {
  const length = Math.hypot(a[0], a[1], a[2])
  return length > 1e-9 ? [a[0] / length, a[1] / length, a[2] / length] : [0, 0, 1]
}

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
  const angle = Math.hypot(turn[0], turn[1], turn[2])
  if (angle < 1e-9) return v
  const k: Vec3 = [turn[0] / angle, turn[1] / angle, turn[2] / angle]
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const across = cross(k, v)
  const along = dot(k, v) * (1 - c)
  return [
    v[0] * c + across[0] * s + k[0] * along,
    v[1] * c + across[1] * s + k[1] * along,
    v[2] * c + across[2] * s + k[2] * along,
  ]
}

/**
 * The light's position after the room turns by `tilt`, a rotation in the wall's frame. It
 * turns about the middle of the wall, where shadows sit still in place of sliding.
 */
export function tiltSource(source: Vec3, tilt: Vec3, aspect: number): Vec3 {
  const pivot: Vec3 = [-0.5 * aspect, 0.5, 0]
  const turned = rotate([source[0] - pivot[0], source[1] - pivot[1], source[2] - pivot[2]], tilt)
  return [turned[0] + pivot[0], turned[1] + pivot[1], turned[2] + pivot[2]]
}

/**
 * The rotation that carries the resting pose to the current one, as the light sees it: in the
 * wall's frame (x right, y down, z toward the viewer), scaled by `influence` and eased into
 * `range`. Both poses are world up in the screen's frame (y toward the top of the screen).
 */
export function relativeTilt(rest: Vec3, current: Vec3, settings: TiltSettings): Vec3 {
  const axis = cross(rest, current)
  const sine = Math.hypot(axis[0], axis[1], axis[2])
  if (sine < 1e-9 || settings.range <= 0) return [0, 0, 0]
  const angle = Math.atan2(sine, dot(rest, current))
  const limit = settings.range * DEGREES
  const eased = limit * Math.tanh((angle * settings.influence) / limit)
  const scale = eased / sine
  // The wall's y runs down the screen, which mirrors the rotation's x and z components.
  return [-axis[0] * scale, axis[1] * scale, -axis[2] * scale]
}

/** Follows the phone's pose and eases the light's turn toward it, frame by frame. */
export function createTiltTracker() {
  let current: Vec3 | null = null
  let rest: Vec3 | null = null
  let tilt: Vec3 = [0, 0, 0]
  return {
    /** A new reading of world up in the screen's frame. */
    read(up: Vec3) {
      current = normalize(up)
      rest ??= current
    },
    /** Forget the pose, e.g. when the screen rotates and its frame jumps. */
    reset() {
      current = rest = null
    },
    /** Advance by `delta` seconds; returns the turn to draw, in the wall's frame. */
    step(delta: number, settings: TiltSettings, enabled: boolean): Vec3 {
      let target: Vec3 = [0, 0, 0]
      if (enabled && current && rest) {
        const settle = 1 - Math.exp(-delta / Math.max(settings.recenter, 0.05))
        rest = normalize([
          rest[0] + (current[0] - rest[0]) * settle,
          rest[1] + (current[1] - rest[1]) * settle,
          rest[2] + (current[2] - rest[2]) * settle,
        ])
        target = relativeTilt(rest, current, settings)
      }
      // Sensor readings arrive unevenly; a short ease hides the steps between them.
      const follow = delta > 0 ? 1 - Math.exp(-delta * 10) : 0
      tilt = [
        tilt[0] + (target[0] - tilt[0]) * follow,
        tilt[1] + (target[1] - tilt[1]) * follow,
        tilt[2] + (target[2] - tilt[2]) * follow,
      ]
      if (Math.hypot(tilt[0] - target[0], tilt[1] - target[1], tilt[2] - target[2]) < 1e-5) {
        tilt = target
      }
      return tilt
    },
    /** Whether the light is still turning toward its target or rest is still settling. */
    moving(settings: TiltSettings) {
      if (Math.hypot(...tilt) > 1e-5) return true
      return relativeTilt(rest ?? [0, 0, 1], current ?? [0, 0, 1], settings).some(
        (value) => Math.abs(value) > 1e-5,
      )
    },
  }
}
