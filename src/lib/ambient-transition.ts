import type { TransitionConfig } from 'dialkit'
import { cubicBezier, spring } from 'motion'

export function smoothStep(value: number) {
  const progress = Math.min(1, Math.max(0, value))
  return progress * progress * (3 - 2 * progress)
}

export function transitionValue(
  from: number,
  to: number,
  elapsed: number,
  duration: number,
  ease = smoothStep,
) {
  const progress = duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 1
  if (progress === 0) return from
  if (progress === 1) return to
  return from + (to - from) * Math.min(1, Math.max(0, ease(progress)))
}

export function transitionTiming(config: TransitionConfig) {
  if (config.type === 'easing') {
    return { duration: config.duration, ease: cubicBezier(...config.ease) }
  }
  const generator = spring({ ...config, keyframes: [0, 1] })
  let milliseconds = 0
  while (milliseconds < 10000 && !generator.next(milliseconds).done) milliseconds += 16
  return {
    duration: milliseconds / 1000,
    ease: (progress: number) => generator.next(progress * milliseconds).value,
  }
}
