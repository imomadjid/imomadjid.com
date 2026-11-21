import { defineSound } from '@web-kits/audio'

import type { Theme } from './theme'

// Synthesized on demand: no audio files, and the AudioContext is only created on the first click.
const themeSounds = {
  // Bright, rising tick.
  light: defineSound({
    source: { type: 'sine', frequency: { start: 620, end: 980 } },
    filter: { type: 'lowpass', frequency: 2400 },
    envelope: { attack: 0.002, decay: 0.07 },
    gain: 0.2,
  }),
  // Softer, falling tick.
  dark: defineSound({
    source: { type: 'triangle', frequency: { start: 520, end: 280 } },
    filter: { type: 'lowpass', frequency: 1400 },
    envelope: { attack: 0.002, decay: 0.09 },
    gain: 0.22,
  }),
  // Neutral two-step blip for following the system setting.
  system: defineSound({
    layers: [
      {
        source: { type: 'sine', frequency: 560 },
        envelope: { attack: 0.002, decay: 0.04 },
        gain: 0.14,
      },
      {
        source: { type: 'sine', frequency: 700 },
        envelope: { attack: 0.002, decay: 0.05 },
        gain: 0.14,
        delay: 0.045,
      },
    ],
  }),
}

export function playThemeSound(theme: Theme) {
  try {
    themeSounds[theme]({ jitter: { detune: 20, volume: 0.05 } })
  } catch {
    // Sound is decoration; the theme change must not depend on Web Audio.
  }
}
