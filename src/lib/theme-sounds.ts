import { defineSound } from '@web-kits/audio'
import type { Layer } from '@web-kits/audio'

import type { Theme } from './theme'

// A small switch thrown, then a soft struck note that names the theme.
// Built like cuelume's toggle: a noise click for the contact, a sine "knock"
// that drops to pitch fast enough to read as body rather than a slide, and a
// quiet note under 5 kHz so repeated toggling never gets shrill.
// Envelope decays here reach about -26 dB at `decay` seconds.

/** The contact: a burst of band-passed noise a few milliseconds long. */
const click = (frequency: number, gain: number): Layer => ({
  source: { type: 'noise' },
  filter: { type: 'bandpass', frequency, resonance: 0.9 },
  envelope: { attack: 0.001, decay: 0.006 },
  gain,
})

/** The body: a sine struck 60% sharp that settles onto `frequency` within ~20 ms. */
const knock = (frequency: number, gain: number): Layer => ({
  source: { type: 'sine', frequency: { start: frequency * 1.6, end: frequency } },
  envelope: { attack: 0.001, decay: 0.018 },
  gain,
})

/** A soft struck note: a sine with a faint glass-bar partial at 2.76x that dies first. */
const note = (frequency: number, gain: number, delay = 0): Layer[] => [
  {
    source: { type: 'sine', frequency },
    envelope: { attack: 0.003, decay: 0.07 },
    gain,
    delay,
  },
  {
    source: { type: 'sine', frequency: frequency * 2.76 },
    envelope: { attack: 0.003, decay: 0.025 },
    gain: gain * 0.25,
    delay,
  },
]

// Synthesized on demand: no audio files, and the AudioContext is only created on the first click.
const themeSounds = {
  // Brightest contact, higher knock, and a G5 that lifts.
  light: defineSound({ layers: [click(2600, 1.7), knock(440, 0.15), ...note(784, 0.03)] }),
  // Duller contact, lower knock, and a C5 that settles.
  dark: defineSound({ layers: [click(1500, 2.2), knock(262, 0.18), ...note(523, 0.034)] }),
  // Neutral contact, then both notes in turn: following the system means either.
  system: defineSound({
    layers: [click(2000, 2), knock(330, 0.15), ...note(523, 0.026), ...note(784, 0.024, 0.045)],
  }),
} satisfies Record<Theme, ReturnType<typeof defineSound>>

/** Overall level: the loudest 30 ms sit near -27 dBFS, a few dB above Allo's switch. */
const LEVEL = 0.45
/** Repeats closer than this play softer, as a real switch flicked quickly does. */
const QUICK_REPEAT_MS = 220
let lastPlayedAt = -Infinity

export function playThemeSound(theme: Theme) {
  const now = performance.now()
  const quickness = Math.max(0, 1 - (now - lastPlayedAt) / QUICK_REPEAT_MS)
  lastPlayedAt = now
  try {
    themeSounds[theme]({
      volume: LEVEL * (1 - 0.25 * quickness),
      jitter: { detune: 15, volume: 0.06 },
    })
  } catch {
    // Sound is decoration; the theme change must not depend on Web Audio.
  }
}
