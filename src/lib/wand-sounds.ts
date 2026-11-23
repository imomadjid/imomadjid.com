import type { Layer } from '@web-kits/audio'

import { HISS_CUT, LEVEL } from './theme-sounds'
import { defineUiSound, playSound } from './ui-sound'

// The blind wand's only sound. Turning the wand drives the tilter's small plastic gear in the
// headrail, which ticks once per tooth, faster as the wand spins.
// Built from the Mechanical patch's noise clicks (web-kits): band-passed noise, a few ms
// long, nothing centred above 5 kHz. A fast tick is about as loud as the theme toggle's sound.
// A narrow band of noise carries little energy, so its gain sits above 1 while its peaks stay
// near -16 dBFS.

/** One tooth of the gear: a dry click with a faint pitched body, so jitter can vary it. */
function tickLayers(center: number): Layer[] {
  return [
    {
      source: { type: 'noise' },
      filter: [{ type: 'bandpass', frequency: center, resonance: 4 }, HISS_CUT],
      envelope: { attack: 0.001, decay: 0.006 },
      gain: 1.5,
    },
    {
      source: { type: 'sine', frequency: { start: center * 0.42, end: center * 0.3 } },
      envelope: { attack: 0.001, decay: 0.006 },
      gain: 0.06,
    },
  ]
}

/** Teeth differ a little, so a run of ticks never sounds like one sample repeated. */
const TICK_CENTERS = [2500, 2700, 2900, 3100] as const

/** A tick's volume from the wand's spin, 0 to 1: slow teeth are softer. */
function tickVolume(speed: number) {
  return 0.5 + 0.5 * Math.min(1, Math.max(0, speed))
}

const ticks = TICK_CENTERS.map((center) => defineUiSound(tickLayers(center)))

/** One gear tooth passing. `speed` is the wand's spin, from 0 to 1. */
export function playWandTick(speed: number) {
  const tick = ticks[Math.floor(Math.random() * ticks.length)]
  if (tick)
    playSound(tick, { volume: LEVEL * tickVolume(speed), jitter: { detune: 40, volume: 0.15 } })
}
