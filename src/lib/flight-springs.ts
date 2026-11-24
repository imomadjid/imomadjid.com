import type { TransitionConfig } from 'dialkit'

/** A damped spring: its natural frequency in radians a second, and its damping ratio. */
export type Spring = { omega: number; zeta: number }

/**
 * The spring a DialKit transition describes, set by response and damping ratio as Apple's are:
 * `visualDuration` (or an easing's `duration`) is the response, and the ratio is 1 less bounce,
 * so a bounce of 0 settles without overshoot. A critically damped spring is about 1.4% short of
 * its target one response in, so the response is close to how long the move looks.
 */
export function springOf(config: TransitionConfig, scale = 1): Spring {
  if (config.type === 'easing') return responseSpring(config.duration * scale, 1)
  if (config.visualDuration !== undefined)
    return responseSpring(config.visualDuration * scale, 1 - (config.bounce ?? 0))
  const mass = config.mass ?? 1
  const stiffness = config.stiffness ?? 100
  const damping = config.damping ?? 10
  return {
    omega: Math.sqrt(stiffness / mass) / scale,
    zeta: damping / (2 * Math.sqrt(stiffness * mass)),
  }
}

function responseSpring(response: number, ratio: number): Spring {
  return { omega: (2 * Math.PI) / Math.max(response, 1e-3), zeta: Math.max(0.05, ratio) }
}

/** Values moving on springs, with their speeds in units a second. */
export type SpringState = { values: number[]; velocities: number[] }

// Short enough for the stiffest spring a flight uses to integrate stably and smoothly.
const SUBSTEP = 1 / 240

/**
 * Moves each value toward its target on its own spring for `dt` seconds, keeping its speed, so a
 * new target turns a moving value around rather than restarting it. A value within its tolerance
 * of the target, and slower than ten tolerances a second, snaps onto it. Returns true once every
 * value has.
 */
export function stepSprings(
  state: SpringState,
  targets: readonly number[],
  springs: readonly Spring[],
  tolerances: readonly number[],
  dt: number,
): boolean {
  const { values, velocities } = state
  let settled = true
  for (const [index, target] of targets.entries()) {
    const { omega, zeta } = springs[index]
    let value = values[index]
    let velocity = velocities[index]
    for (let left = dt; left > 0; left -= SUBSTEP) {
      const h = Math.min(SUBSTEP, left)
      velocity += (-omega * omega * (value - target) - 2 * zeta * omega * velocity) * h
      value += velocity * h
    }
    const tolerance = tolerances[index]
    if (Math.abs(value - target) < tolerance && Math.abs(velocity) < tolerance * 10) {
      value = target
      velocity = 0
    } else {
      settled = false
    }
    values[index] = value
    velocities[index] = velocity
  }
  return settled
}

/**
 * A spring from rest at 0 to 1 as a CSS transition: how long it takes to settle, and a `linear()`
 * easing sampled along it, overshoot included.
 */
export function cssSpring(config: TransitionConfig) {
  const spring = springOf(config)
  const frame = 1 / 120
  const state = { values: [0], velocities: [0] }
  const samples = [0]
  while (samples.length < 600 && !stepSprings(state, [1], [spring], [1e-3], frame))
    samples.push(state.values[0])
  samples.push(1)
  // About 40 stops follow the curve closely without a long string.
  const stride = Math.max(1, Math.round(samples.length / 40))
  const stops = samples.filter((_, index) => index % stride === 0 || index === samples.length - 1)
  return {
    duration: (samples.length - 1) * frame,
    easing: `linear(${stops.map((value) => Number(value.toFixed(4))).join(', ')})`,
  }
}
