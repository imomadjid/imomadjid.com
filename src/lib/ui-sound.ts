import { ensureReady } from '@web-kits/audio'
import type { PlayOptions, VoiceHandle } from '@web-kits/audio'

import { prefersReducedMotion } from './theme'

// The interface sounds share web-kits' one AudioContext. It starts on the first gesture
// anywhere on the page, so it is running before a sound first plays, and any pop from an
// output device waking up lands apart from the sound.

/** Output callbacks advance the audio clock every few ms, about 20 at most. */
const STALL_MS = 50

type Clock = Pick<BaseAudioContext, 'state' | 'currentTime'>

/**
 * Whether a sound played now would start now. web-kits schedules every voice at
 * `currentTime`, so while the clock stands still (at 0 while the output device opens, or
 * later if the device stalls) sounds queue at one instant and sum into a loud burst when it
 * moves. Chrome reports `running` before its clock starts, so the state alone isn't enough.
 */
export function createClockCheck(stallMs = STALL_MS) {
  let seenTime = -1
  let seenAt = -Infinity
  return (clock: Clock, now: number) => {
    if (clock.state !== 'running' || clock.currentTime <= 0) return false
    if (clock.currentTime !== seenTime) {
      seenTime = clock.currentTime
      seenAt = now
      return true
    }
    return now - seenAt < stallMs
  }
}

const clockRunning = createClockCheck()
let context: AudioContext | null = null

/** Starts the AudioContext. Browsers only let it start during a user gesture. */
function warmSounds() {
  if (prefersReducedMotion() || context?.state === 'running') return
  // Outside a gesture the context can't start, and Chrome warns about creating it.
  if (navigator.userActivation && !navigator.userActivation.isActive) return
  ensureReady()
    .then((ready) => {
      context = ready
    })
    .catch(() => {})
}

// A mouse press activates the page on pointerdown, a touch only on pointerup.
const GESTURES = ['pointerdown', 'pointerup', 'keydown'] as const

/**
 * Starts audio on every gesture until it runs, and again if it stops (iOS suspends it for
 * calls and other apps). Returns a cleanup.
 */
export function warmSoundsOnGesture() {
  const options = { capture: true, passive: true }
  for (const type of GESTURES) window.addEventListener(type, warmSounds, options)
  return () => {
    for (const type of GESTURES) window.removeEventListener(type, warmSounds, options)
  }
}

/**
 * Plays a web-kits sound if the audio clock is running, and drops it otherwise. It never starts
 * the AudioContext itself, so sounds that answer hover or focus, which aren't gestures, stay
 * silent until a gesture has.
 */
export function playSound(sound: (options?: PlayOptions) => VoiceHandle, options: PlayOptions) {
  // Reduced motion doubles as the opt-out for interface sound.
  if (prefersReducedMotion() || !context || !clockRunning(context, performance.now())) return
  try {
    sound(options)
  } catch {
    // Sound is decoration; nothing may depend on Web Audio.
  }
}
