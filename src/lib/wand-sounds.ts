import { defineSound } from '@web-kits/audio'
import type { Layer } from '@web-kits/audio'

import { prefersReducedMotion } from './theme'
import type { Scheme } from './theme'
import { GLASS, HISS_CUT, LEVEL, WOOD, note } from './theme-sounds'

// The blind wand's sounds. Turning the wand drives the tilter's small plastic gear in the
// headrail, which ticks once per tooth, faster as the wand spins. Opening, the slats rock apart
// down the blind as the light comes in; closing, they clack shut near the end of the turn. The
// theme's note sounds under them.
// Built from the Mechanical patch's noise clicks (web-kits): band-passed noise, a few ms
// long, nothing centred above 5 kHz. Levels are relative to the theme toggle's LEVEL.

/** One tooth of the gear: a dry click with a faint pitched body, so jitter can vary it. */
export function tickLayers(center: number): Layer[] {
  return [
    {
      source: { type: 'noise' },
      filter: [{ type: 'bandpass', frequency: center, resonance: 4 }, HISS_CUT],
      envelope: { attack: 0.001, decay: 0.004 },
      gain: 0.36,
    },
    {
      source: { type: 'sine', frequency: { start: center * 0.42, end: center * 0.3 } },
      envelope: { attack: 0.001, decay: 0.006 },
      gain: 0.014,
    },
  ]
}

/** Teeth differ a little, so a run of ticks never sounds like one sample repeated. */
const TICK_CENTERS = [2500, 2700, 2900, 3100] as const

/** A tick's volume from the wand's spin, 0 to 1: slow teeth are barely there. */
export function tickVolume(speed: number) {
  return 0.3 + 0.7 * Math.min(1, Math.max(0, speed))
}

// Slat taps, top to bottom, slightly uneven like real slats, in seconds.
const SLAT_TIMES = [0, 0.012, 0.025, 0.036, 0.05, 0.061] as const

const mix = (from: number, to: number, t: number) => from + (to - from) * t

/**
 * The slats rocking against each other down the blind. Closing runs a little slower, falls in
 * pitch and settles with a soft thud as they meet; opening rises and stays light.
 */
function slatLayers(closing: boolean): Layer[] {
  const last = SLAT_TIMES.length - 1
  const spacing = closing ? 1.4 : 1
  const taps = SLAT_TIMES.flatMap((time, index): Layer[] => {
    const delay = time * spacing
    const t = index / last
    const center = closing ? mix(2300, 1500, t) : mix(1500, 2500, t)
    const level = closing ? mix(1.05, 0.72, t) : mix(0.85, 1.15, t)
    return [
      {
        source: { type: 'noise' },
        filter: [{ type: 'bandpass', frequency: center, resonance: 3.5 }, HISS_CUT],
        envelope: { attack: 0.001, decay: 0.006 },
        gain: level,
        delay,
      },
      {
        source: { type: 'sine', frequency: center * 0.22 },
        envelope: { attack: 0.001, decay: 0.01 },
        gain: level * 0.04,
        delay,
      },
    ]
  })
  if (!closing) return taps
  const settle = (SLAT_TIMES[last] ?? 0) * spacing + 0.008
  return [
    ...taps,
    {
      source: { type: 'sine', frequency: { start: 190, end: 120 } },
      envelope: { attack: 0.002, decay: 0.03 },
      gain: 0.07,
      delay: settle,
    },
  ]
}

/** The slats opening or shutting, with the theme's note under them, a little softer than the toggle's. */
export const switchLayers = {
  light: [...slatLayers(false), ...note(784, 0.05, 0.07, GLASS)],
  dark: [...slatLayers(true), ...note(523, 0.056, 0.08, WOOD)],
} satisfies Record<Scheme, Layer[]>

const ticks = TICK_CENTERS.map((center) => defineSound({ layers: tickLayers(center) }))
const switches = {
  light: defineSound({ layers: switchLayers.light }),
  dark: defineSound({ layers: switchLayers.dark }),
}

/** One gear tooth passing. `speed` is the wand's spin, from 0 to 1. */
export function playWandTick(speed: number) {
  if (prefersReducedMotion()) return
  const tick = ticks[Math.floor(Math.random() * ticks.length)]
  try {
    tick?.({ volume: LEVEL * tickVolume(speed), jitter: { detune: 40, volume: 0.15 } })
  } catch {
    // Sound is decoration; the wand must not depend on Web Audio.
  }
}

/** The slats opening for light or shutting for dark. */
export function playWandSwitch(scheme: Scheme) {
  if (prefersReducedMotion()) return
  try {
    switches[scheme]({ volume: LEVEL, jitter: { detune: 15 } })
  } catch {
    // Sound is decoration; the theme change must not depend on Web Audio.
  }
}
