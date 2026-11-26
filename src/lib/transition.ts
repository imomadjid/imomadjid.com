// A motion as the settings describe it: a spring, by its visual duration and bounce (or its
// stiffness, damping and mass), or an easing curve over a duration. `springOf` in
// flight-springs.ts turns either into a damped spring, and `transitionTiming` in
// ambient-transition.ts into a CSS timing.

export type SpringConfig = {
  type: 'spring'
  stiffness?: number
  damping?: number
  mass?: number
  visualDuration?: number
  bounce?: number
}

export type EasingConfig = {
  type: 'easing'
  duration: number
  ease: [number, number, number, number]
}

export type TransitionConfig = SpringConfig | EasingConfig

/** A spring that looks to take `visualDuration` seconds, overshooting by `bounce` (0 for none). */
export const spring = (visualDuration: number, bounce = 0): SpringConfig => ({
  type: 'spring',
  visualDuration,
  bounce,
})

/** A cubic Bézier `ease` over `duration` seconds. */
export const easing = (duration: number, ease: EasingConfig['ease']): EasingConfig => ({
  type: 'easing',
  duration,
  ease,
})
