import { defineSound, ensureReady } from '@web-kits/audio'
import type { Layer, PlayOptions, VoiceHandle } from '@web-kits/audio'

import { prefersReducedMotion } from './theme'

// The interface sounds share web-kits' one AudioContext. It starts on the first gesture
// anywhere on the page, so it is running before a sound first plays, and any pop from an
// output device waking up lands apart from the sound. Its lifecycle after that, sleeping
// when quiet and replacing a context whose clock has died, follows cuelume
// (github.com/danielwh2/cuelume, MIT).

/** Output callbacks advance the audio clock every few ms, about 20 at most. */
const STALL_MS = 50

/**
 * How long after it is played every sound starts. WebKit (Safari, and browsers built on it)
 * can play an oscillator scheduled for the current instant at full gain for its first few ms,
 * before its envelope applies. It happened on the first sound after audio started, on every
 * fresh page: a tick's faint sine onset about 28 times its level, a pop. Starting 10 ms ahead
 * cut that to 2 in 20 pages, and `primeAudio` to 1 in 20; together, none in 60.
 */
const LEAD_S = 0.01

/** A web-kits sound whose layers all start `LEAD_S` after it is played. */
export function defineUiSound(layers: Layer[]) {
  return defineSound({
    layers: layers.map((layer) => ({ ...layer, delay: (layer.delay ?? 0) + LEAD_S })),
  })
}

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

/**
 * How long audio sits quiet before it is suspended. A running context holds the output device
 * open at its smallest buffer for as long as the page lives, and in Safari and WebKit browsers
 * that makes other apps' audio crackle. Every sound here is over well within it.
 */
const IDLE_SUSPEND_MS = 1000
/** How long after audio starts or wakes before a sound plays, so the primer sounds first. */
const WAKE_SETTLE_MS = 20
/** A sound still waiting on audio to wake after this long belongs to a moment already past. */
const STALE_MS = 200
/**
 * Safari can come back from sleep or a screen lock with the context reading `running` and its
 * clock stopped, and it never plays again. So this long after a sound, the clock must have moved
 * at least `STOPPED_CLOCK_S`, or the context is closed and the next gesture builds a fresh one.
 */
const CLOCK_PROBE_MS = 750
const STOPPED_CLOCK_S = 0.1

/** A suspend in flight: the context still reads `running` but is about to stop. */
let suspending = false
/** Counts suspends, so a clock probe can tell its context ran throughout. */
let suspends = 0
let waking = false
/** Sounds wait until then, after audio starts or wakes. */
let settledAt = 0
/** The latest sound asked for while audio was asleep or settling. */
let waiting: { play: () => void; at: number } | null = null
let idleTimer: ReturnType<typeof setTimeout> | undefined
let settleTimer: ReturnType<typeof setTimeout> | undefined
let probe: ReturnType<typeof setTimeout> | undefined

const isReady = (audio: AudioContext) => audio.state === 'running' && !suspending

/**
 * Runs a silent oscillator as audio starts, so WebKit's late first envelope (see `LEAD_S`)
 * falls on it rather than on a sound. Its gain is set outright, with no automation to apply
 * late.
 */
function primeAudio(audio: AudioContext) {
  const oscillator = audio.createOscillator()
  const silence = audio.createGain()
  silence.gain.value = 0
  oscillator.connect(silence).connect(audio.destination)
  oscillator.start()
  oscillator.stop(audio.currentTime + 0.05)
  oscillator.onended = () => silence.disconnect()
}

/** Audio has started or woken: prime it, then play what waited once the primer has gone first. */
function started(audio: AudioContext) {
  primeAudio(audio)
  settledAt = performance.now() + WAKE_SETTLE_MS
  clearTimeout(settleTimer)
  settleTimer = setTimeout(flush, WAKE_SETTLE_MS)
  idleSoon()
}

/** Plays the sound that waited, if it is still fresh. */
function flush() {
  const next = waiting
  waiting = null
  if (!next || !context || !isReady(context) || performance.now() - next.at > STALE_MS) return
  if (clockRunning(context, performance.now())) next.play()
}

function idleSoon() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(suspendIdle, IDLE_SUSPEND_MS)
}

function suspendIdle() {
  const audio = context
  if (!audio || !isReady(audio)) return
  suspending = true
  suspends++
  const settle = () => {
    if (audio === context) suspending = false
  }
  audio.suspend().then(settle, settle)
}

/** Resumes a sleeping context. A gesture can always; after the first one, so can a sound. */
function wake(audio: AudioContext) {
  if (waking) return
  waking = true
  audio.resume().then(
    () => {
      waking = false
      if (audio === context && audio.state === 'running') started(audio)
    },
    () => {
      waking = false
    },
  )
}

/** Closes a context whose clock has died. The next gesture builds a fresh one. */
function forget(audio: AudioContext) {
  if (audio !== context) return
  context = null
  waiting = null
  suspending = false
  clearTimeout(idleTimer)
  audio.close().catch(() => {})
}

function watchClock(audio: AudioContext) {
  if (probe !== undefined) return
  const from = audio.currentTime
  const epoch = suspends
  probe = setTimeout(() => {
    probe = undefined
    if (audio !== context || epoch !== suspends || !isReady(audio)) return
    if (audio.currentTime - from < STOPPED_CLOCK_S) forget(audio)
  }, CLOCK_PROBE_MS)
}

/** Starts or wakes audio. Browsers only let it start during a user gesture. */
function warmSounds() {
  if (prefersReducedMotion()) return
  if (context) {
    if (!isReady(context)) wake(context)
    return
  }
  // Outside a gesture the context can't start, and Chrome warns about creating it.
  if (navigator.userActivation && !navigator.userActivation.isActive) return
  ensureReady()
    .then((ready) => {
      if (context === ready || ready.state !== 'running') return
      context = ready
      started(ready)
    })
    .catch(() => {})
}

// A mouse press activates the page on pointerdown, a touch only on pointerup.
const GESTURES = ['pointerdown', 'pointerup', 'keydown'] as const

/**
 * Starts audio on the first gesture, and wakes it on each one after, so it is usually awake
 * before a sound is asked for. Returns a cleanup.
 */
export function warmSoundsOnGesture() {
  const options = { capture: true, passive: true }
  for (const type of GESTURES) window.addEventListener(type, warmSounds, options)
  return () => {
    for (const type of GESTURES) window.removeEventListener(type, warmSounds, options)
  }
}

/**
 * Plays a web-kits sound now if audio is awake and its clock is moving. While audio sleeps or
 * settles, the latest sound waits and plays once it wakes, if still fresh; a stalled clock drops
 * it. It never starts audio itself, so sounds that answer hover or focus, which aren't gestures,
 * stay silent until a gesture has.
 */
export function playSound(sound: (options?: PlayOptions) => VoiceHandle, options: PlayOptions) {
  // Reduced motion doubles as the opt-out for interface sound.
  if (prefersReducedMotion() || !context) return
  const audio = context
  const play = () => {
    try {
      sound(options)
    } catch {
      // Sound is decoration; nothing may depend on Web Audio.
      return
    }
    idleSoon()
    watchClock(audio)
  }
  const now = performance.now()
  if (!isReady(audio) || now < settledAt) {
    waiting = { play, at: now }
    if (!isReady(audio)) wake(audio)
    return
  }
  if (clockRunning(audio, now)) play()
}
