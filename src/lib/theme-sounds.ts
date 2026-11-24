import type { Layer } from '@web-kits/audio'

import type { Theme } from './theme'
import { defineUiSound, playSound } from './ui-sound'

// A small switch thrown, then a struck note that names the theme: glass G5
// for light, a rounder wooden C5 for dark, both at once for system.
// Built like cuelume's toggle: a click for the contact, a sine "knock" that
// drops to pitch fast enough to read as body rather than a slide, and a note
// loud enough to carry the theme. Nothing is centred above 5 kHz.
// Envelope decays here reach about -26 dB at `decay` seconds.

/** Cuts the hiss above the click's resonances. */
export const HISS_CUT = { type: 'lowpass', frequency: 4500, resonance: -3 } as const

/** The contact: a narrow ring over a wider body below it, so it reads as a part rather than a puff of noise. */
const click = (frequency: number, gain: number): Layer[] => [
  {
    source: { type: 'noise' },
    filter: [{ type: 'bandpass', frequency, resonance: 5 }, HISS_CUT],
    envelope: { attack: 0.001, decay: 0.005 },
    gain,
  },
  {
    source: { type: 'noise' },
    filter: [{ type: 'bandpass', frequency: frequency * 0.6, resonance: 1.5 }, HISS_CUT],
    envelope: { attack: 0.001, decay: 0.006 },
    gain: gain * 0.45,
  },
]

/** The body: a sine struck 60% sharp that settles onto `frequency` within ~20 ms. */
const knock = (frequency: number, gain: number): Layer => ({
  source: { type: 'sine', frequency: { start: frequency * 1.6, end: frequency } },
  envelope: { attack: 0.001, decay: 0.018 },
  gain,
})

/** Overtones of a struck material as [ratio to the note, level, decay]. Real bars are inharmonic. */
type Mode = readonly [ratio: number, level: number, decay: number]
/** A free glass bar: modes at 2.76x and 5.4x, the higher dying first. */
const GLASS: readonly Mode[] = [
  [2.76, 0.3, 0.03],
  [5.4, 0.08, 0.014],
]
/** An undercut wooden bar, like a marimba: one rounder mode at 3.99x. */
const WOOD: readonly Mode[] = [[3.99, 0.14, 0.02]]

/** A struck note: a sine fundamental plus the material's overtones. */
const note = (frequency: number, gain: number, decay: number, modes: readonly Mode[]): Layer[] => [
  { source: { type: 'sine', frequency }, envelope: { attack: 0.003, decay }, gain },
  ...modes.map(([ratio, level, modeDecay]): Layer => ({
    source: { type: 'sine', frequency: frequency * ratio },
    envelope: { attack: 0.002, decay: modeDecay },
    gain: gain * level,
  })),
]

/** The toggle's sounds as data. */
const themeSoundLayers = {
  light: [...click(2400, 1.4), knock(392, 0.2), ...note(784, 0.07, 0.07, GLASS)],
  dark: [...click(1400, 1.6), knock(262, 0.22), ...note(523, 0.08, 0.08, WOOD)],
  // An open fifth: C5 and G5 struck together. The C5 has no overtone, so it doesn't beat against the glass.
  system: [
    ...click(1900, 1.4),
    knock(330, 0.18),
    ...note(523, 0.05, 0.075, []),
    ...note(784, 0.045, 0.07, GLASS),
  ],
} satisfies Record<Theme, Layer[]>

// Synthesized on demand: no audio files, and the AudioContext only starts on interaction
// (`warmSoundsOnGesture`).
const themeSounds = {
  light: defineUiSound(themeSoundLayers.light),
  dark: defineUiSound(themeSoundLayers.dark),
  system: defineUiSound(themeSoundLayers.system),
} satisfies Record<Theme, ReturnType<typeof defineUiSound>>

/** Overall level: the loudest 30 ms sit near -30 dBA, about where Allo's switch plays. */
export const LEVEL = 0.55

/**
 * Softens a sound that repeats quickly, as cuelume does: each call returns its volume, full when
 * the last call was `slowMs` ago or more, easing down by `depth` as the gap shrinks to `fastMs`.
 */
export function repeatDuck(fastMs: number, slowMs: number, depth: number) {
  let lastPlayedAt = -Infinity
  return (now: number) => {
    const quickness = Math.min(1, Math.max(0, (slowMs - (now - lastPlayedAt)) / (slowMs - fastMs)))
    lastPlayedAt = now
    return 1 - depth * quickness
  }
}

/** Repeats faster than 80 ms play 30% softer, easing back to full by 250 ms. */
const themeDuck = repeatDuck(80, 250, 0.3)

export function playThemeSound(theme: Theme) {
  playSound(themeSounds[theme], {
    volume: LEVEL * themeDuck(performance.now()),
    jitter: { detune: 15 },
  })
}
