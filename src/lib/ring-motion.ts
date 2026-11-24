// Ring-by-ring zoom shared by the gallery's WebGPU renderers. A zoom is split into rings around
// the middle of a frame; each ring runs its own eased move, delayed by its distance from the
// middle, so the middle leads and the edges follow.

/** Must match RING_COUNT in src/shaders/rings.wgsl. */
export const RING_COUNT = 48

export type RingTiming = {
  /** Seconds each ring takes to move. */
  duration: number
  /** Seconds the outermost ring starts after the middle. */
  lead: number
  ease: (progress: number) => number
}

export type RingMotion = {
  /** Each ring's position between 0 and 1 (it may overshoot with a spring). */
  readonly progress: Float32Array
  /** Starts a move toward `target` from wherever each ring is; false if it is already the target. */
  retarget: (target: number, now: number) => boolean
  /** Puts every ring at `target` at once, with nothing left to move. */
  jump: (target: number) => void
  /** Advances every ring to `now`; true once all of them have arrived. */
  step: (now: number, timing: RingTiming) => boolean
}

export function createRingMotion(): RingMotion {
  const progress = new Float32Array(RING_COUNT)
  const start = new Float32Array(RING_COUNT)
  let target = 0
  let moveStart = 0
  return {
    progress,
    retarget(next, now) {
      if (next === target) return false
      // Restart every ring from where it is, so a reversal never jumps.
      start.set(progress)
      target = next
      moveStart = now
      return true
    },
    jump(next) {
      target = next
      progress.fill(next)
      start.fill(next)
      moveStart = Number.NEGATIVE_INFINITY
    },
    step(now, { duration, lead, ease }) {
      const elapsed = (now - moveStart) / 1000
      let settled = true
      for (let i = 0; i < RING_COUNT; i += 1) {
        const radius = i / (RING_COUNT - 1)
        const eased = delayedEase(elapsed, lead * radius, duration, ease)
        if (eased.moving) settled = false
        progress[i] = start[i] + (target - start[i]) * eased.value
      }
      return settled
    },
  }
}

/**
 * How far along an eased move that starts `delay` seconds in and lasts `duration` is at `elapsed`,
 * and whether it is still moving. Clamped before the ease, so a spring may overshoot.
 */
function delayedEase(
  elapsed: number,
  delay: number,
  duration: number,
  ease: (progress: number) => number,
) {
  const local = duration > 0 ? (elapsed - delay) / duration : 1
  return { value: local <= 0 ? 0 : local >= 1 ? 1 : ease(local), moving: local < 1 }
}

/**
 * Turns each ring's zoom into grid pixels per screen pixel for the shaders, packed four to a
 * vec4. It keeps radius / zoom nondecreasing: a ring may never show content nearer the middle
 * than the ring inside it, or the image folds over itself.
 */
export function ringUniforms(zoomAt: (ring: number, radius: number) => number): number[][] {
  const values: number[] = []
  let previousReach = 0
  for (let i = 0; i < RING_COUNT; i += 1) {
    const radius = i / (RING_COUNT - 1)
    const zoom = zoomAt(i, radius)
    const reach = Math.max(radius / zoom, previousReach)
    previousReach = reach
    values.push(i === 0 ? 1 / zoom : reach / radius)
  }
  const vectors: number[][] = []
  for (let i = 0; i < RING_COUNT; i += 4) vectors.push(values.slice(i, i + 4))
  return vectors
}
