// Mouse gusts in the Sunlit canopy. A quick stroke of the pointer pushes air at the branches:
// each branch swings about where it is attached, on a spring that overshoots rest a couple of
// times before it settles, and the leaves near the stroke turn in the moving air, so their
// shadows flicker. The flicker spreads out from the stroke as it fades.
//
// Swinging turns each branch as a whole, so leaf shadows keep their shapes: an earlier gust
// shifted the shadow image by an amount that faded with distance from the pointer, which
// stretched leaves by up to a quarter where it faded. Turning a leaf changes how much light it
// blocks, so the flicker changes leaf coverage rather than moving the shadow.

/** World units are wall heights, in the wall's frame (x right, y down). */
type Point = [number, number]

export type GustSettings = {
  /** How hard the pointer pushes, 0 for no gusts. */
  strength: number
  /** Roughly the seconds a gust takes to die away. */
  recovery: number
  /** How strongly leaves flicker near the stroke, 0 to 1. */
  rustle: number
}

/** What the shader draws. Sway angles are in radians, clockwise on screen. */
export type GustState = {
  nearSway: number
  farSway: number
  /** Flicker strength at the middle of the spreading patch, 0 to 1. */
  rustle: number
  /** The patch's radius, in canopy texture units. */
  rustleSpread: number
  /** The flicker's phase, in radians. */
  rustlePhase: number
}

const DEGREES = Math.PI / 180
// The near branch is lighter and swings faster; the far one is heavier and slower.
const BRANCHES = {
  near: { frequency: 1.3, share: 1, delay: 0 },
  far: { frequency: 0.85, share: 0.6, delay: 0.15 },
} as const
// Most a branch swings either way, as the amplitude of its oscillation.
const MAX_SWAY = 1.4 * DEGREES
// Angular velocity per unit of swept angle times stroke speed (wall heights per second).
const PUSH = 0.11
// Flicker energy per wall height of stroke times its speed.
const RUSTLE_PUSH = 0.6
const RUSTLE_RADIUS = 0.12
const RUSTLE_SPREAD = 0.5
// Leaves turn a few times a second in moving air.
const RUSTLE_RATE = 2 * Math.PI * 3.2
const SETTLED = 1e-5

type Branch = { angle: number; rate: number }
type Push = { at: number; rate: number }

/**
 * The swing a stroke from `point` by `step` gives a branch attached at `anchor`: the angle the
 * stroke sweeps about the attachment, scaled by its speed, since air drag grows with speed.
 * Positive swings clockwise on screen, which carries the leaves under the stroke along it.
 */
export function pushRate(point: Point, step: Point, seconds: number, anchor: Point) {
  const reach: Point = [point[0] - anchor[0], point[1] - anchor[1]]
  const swept =
    (reach[0] * step[1] - reach[1] * step[0]) / Math.max(reach[0] ** 2 + reach[1] ** 2, 0.04)
  return swept * (Math.hypot(...step) / seconds) * PUSH
}

export function createGust() {
  const branches = { near: { angle: 0, rate: 0 }, far: { angle: 0, rate: 0 } }
  let pending: Push[] = []
  let time = 0
  let rustle = 0
  let rustleAge = 0
  let rustlePhase = 0

  function swing(branch: Branch, frequency: number, delta: number, settings: GustSettings) {
    const omega = 2 * Math.PI * frequency
    const damping = 2 / Math.max(settings.recovery, 0.1)
    // Semi-implicit Euler stays stable for these frequencies at 120 steps a second.
    const steps = Math.ceil(delta * 120)
    for (let index = 0; index < steps; index += 1) {
      const dt = delta / steps
      branch.rate -= (omega * omega * branch.angle + 2 * damping * branch.rate) * dt
      branch.angle += branch.rate * dt
    }
  }

  function kick(branch: Branch, rate: number, frequency: number) {
    branch.rate += rate
    // Ease off pushes past the most the branch can swing.
    const omega = 2 * Math.PI * frequency
    const amplitude = Math.hypot(branch.angle, branch.rate / omega)
    if (amplitude > MAX_SWAY) {
      branch.angle *= MAX_SWAY / amplitude
      branch.rate *= MAX_SWAY / amplitude
    }
  }

  return {
    /**
     * A pointer stroke from `point` by `step` over `seconds`. `anchors` are where the
     * branches' attachments cast their shadows; all are wall positions.
     */
    push(
      point: Point,
      step: Point,
      seconds: number,
      anchors: { near: Point; far: Point },
      settings: GustSettings,
    ) {
      if (seconds <= 0 || settings.strength <= 0) return
      for (const name of ['near', 'far'] as const) {
        const { share, delay, frequency } = BRANCHES[name]
        const rate = pushRate(point, step, seconds, anchors[name]) * share * settings.strength
        if (delay > 0) pending.push({ at: time + delay, rate })
        else kick(branches[name], rate, frequency)
      }
      const speed = Math.hypot(...step) / seconds
      rustle = Math.min(1, rustle + Math.hypot(...step) * speed * RUSTLE_PUSH * settings.strength)
      rustleAge = 0
    },
    /** Advance by `delta` seconds. */
    step(delta: number, settings: GustSettings): GustState {
      time += delta
      // The far branch feels each push a moment later, as the gust travels.
      for (const push of pending) {
        if (push.at <= time) kick(branches.far, push.rate, BRANCHES.far.frequency)
      }
      pending = pending.filter((push) => push.at > time)
      swing(branches.near, BRANCHES.near.frequency, delta, settings)
      swing(branches.far, BRANCHES.far.frequency, delta, settings)
      rustle *= Math.exp((-delta * 2) / Math.max(settings.recovery, 0.1))
      rustleAge += delta
      rustlePhase = (rustlePhase + delta * RUSTLE_RATE) % (2 * Math.PI * 64)
      const rustleSpread = RUSTLE_RADIUS + RUSTLE_SPREAD * rustleAge
      return {
        nearSway: branches.near.angle,
        farSway: branches.far.angle,
        // The same flicker spread over a wider patch is weaker at any one leaf.
        rustle: rustle * settings.rustle * (RUSTLE_RADIUS / rustleSpread),
        rustleSpread,
        rustlePhase,
      }
    },
    /** Whether a branch is still swinging, a push is on its way, or leaves still flicker. */
    moving() {
      return (
        pending.length > 0 ||
        rustle > SETTLED ||
        Object.values(branches).some(
          (branch) => Math.abs(branch.angle) > SETTLED || Math.abs(branch.rate) > SETTLED,
        )
      )
    },
    /** Stop at once, as for reduced motion or a hidden page. */
    reset() {
      branches.near = { angle: 0, rate: 0 }
      branches.far = { angle: 0, rate: 0 }
      pending = []
      rustle = 0
    },
  }
}
