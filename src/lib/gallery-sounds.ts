import type { Layer } from '@web-kits/audio'

import { click, HISS_CUT, knock, LEVEL, repeatDuck } from './theme-sounds'
import { defineUiSound, playSound } from './ui-sound'

// The Gallery sits beside its camera, so it speaks in that camera's voice: a focal-plane shutter.
// Opening a photo fires it once, its curtains as far apart as that photo's own exposure, so a
// 1/640 street shot snaps and a 0.8 s night shot drawls, its second curtain closing about as the
// photo lands. Opening See more fires a short burst, the 16 photos coming off the roll at once.
// Closing either lets the shutter button back up: one soft contact, lower than any curtain, so
// it reads as the press undone rather than another picture taken.
// Nothing else sounds. The tiles' hover zooms are decorative and the landings, relighting and
// page recede are the tail of a motion the press already voiced.
// Built from the theme toggle's parts: a noise click for each contact and a sine knock for the
// small body it shakes. Nothing is centred above 5 kHz.

/** Starts every layer `seconds` after the sound does. */
const at = (seconds: number, layers: Layer[]): Layer[] =>
  layers.map((layer) => ({ ...layer, delay: (layer.delay ?? 0) + seconds }))

/** The shortest gap that still reads as two curtains rather than one click. */
const MIN_GAP_S = 0.012
/** The open's visual duration (gallery-settings `expand.open`): no curtain trails the landing. */
const MAX_GAP_S = 0.55
/** The spring recharging, this long after the second curtain lands. */
const CHARGE_AFTER_S = 0.022

/** An exposure time as the camera prints it (`1/250`, `0.8`, `2`), in seconds. */
export function shutterSeconds(shutter: string) {
  const [numerator = NaN, denominator = 1] = shutter.split('/').map(Number)
  const seconds = numerator / denominator
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
}

/** The gap between the shutter's curtains for an exposure, in whole milliseconds as seconds. */
export function curtainGap(seconds: number) {
  const gap = Math.min(MAX_GAP_S, Math.max(MIN_GAP_S, seconds))
  return Math.round(gap * 1000) / 1000
}

/**
 * One frame: the first curtain, lower and heavier as it starts the cycle; the second, brighter
 * and lighter, `gap` later; then the charge, a muffled brush of the spring rewinding. `level`
 * scales it, and `tone` moves its contacts, so frames in a burst differ as real ones do.
 */
function frameLayers(gap: number, level = 1, tone = 1): Layer[] {
  return [
    ...click(1700 * tone, 1.3 * level),
    knock(170, 0.2 * level),
    ...at(gap, [...click(2300 * tone, level), knock(210, 0.12 * level)]),
    ...at(gap + CHARGE_AFTER_S, [
      {
        source: { type: 'noise' },
        filter: [{ type: 'bandpass', frequency: 900, resonance: 1 }, HISS_CUT],
        envelope: { attack: 0.006, decay: 0.035 },
        gain: 0.35 * level,
      },
    ]),
  ]
}

/** A burst's frames: about the pace of a mechanical burst, each a little softer. */
const BURST_FRAME_S = 0.125
const BURST: readonly (readonly [level: number, tone: number])[] = [
  [1, 1],
  [0.8, 1.04],
  [0.66, 0.97],
]

/** The gallery's sounds as data. */
const gallerySoundLayers = {
  shutter: (gap: number) => frameLayers(gap),
  // Three frames at a fast shutter, done within the 0.55 s open.
  burst: BURST.flatMap(([level, tone], frame) =>
    at(frame * BURST_FRAME_S, frameLayers(MIN_GAP_S, level, tone)),
  ),
  release: [...click(1300, 1.2), knock(150, 0.16)],
}

/** One shutter sound per gap; the photos share a couple of dozen exposures. */
const shutters = new Map<number, ReturnType<typeof defineUiSound>>()
function shutterSound(gap: number) {
  let sound = shutters.get(gap)
  if (!sound) {
    sound = defineUiSound(gallerySoundLayers.shutter(gap))
    shutters.set(gap, sound)
  }
  return sound
}
const burst = defineUiSound(gallerySoundLayers.burst)
const release = defineUiSound(gallerySoundLayers.release)

/** Closing weighs less than opening: about 5 dB under the shutter's loudest 30 ms. */
const RELEASE_LEVEL = 0.7
/** Opens and closes faster than 120 ms apart play 30% softer, easing back to full by 300 ms. */
const duck = repeatDuck(120, 300, 0.3)
const jitter = { detune: 20, volume: 0.08 }

/** A photo opens full screen. `shutter` is its exposure time as the camera prints it. */
export function playShutter(shutter: string) {
  const gap = curtainGap(shutterSeconds(shutter))
  playSound(shutterSound(gap), { volume: LEVEL * duck(performance.now()), jitter })
}

/** The See more overlay opens. */
export function playBurst() {
  playSound(burst, { volume: LEVEL * duck(performance.now()), jitter })
}

/** A photo or the See more overlay starts to close. */
export function playRelease() {
  playSound(release, { volume: LEVEL * RELEASE_LEVEL * duck(performance.now()), jitter })
}
