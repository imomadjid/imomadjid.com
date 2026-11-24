import type { Layer } from '@web-kits/audio'

import { click, HISS_CUT, knock, LEVEL } from './theme-sounds'
import { defineUiSound, playSound } from './ui-sound'

// The Gallery sits beside its camera, so it speaks in that camera's voice. Opening every photo
// fires the shutter; closing them lets the shutter button back up. Nothing else in the section
// sounds: the See more tile's zoom answers hover, and the photos' staggered entrance would be
// a dozen clicks for one action.
// Built from the theme toggle's parts: a noise click for each contact, a sine knock for the body
// it shakes. Nothing is centred above 5 kHz.

/** Starts every layer `seconds` after the sound does. */
const at = (seconds: number, layers: Layer[]): Layer[] =>
  layers.map((layer) => ({ ...layer, delay: (layer.delay ?? 0) + seconds }))

/** The gap between the shutter's two curtains, like a mirrorless camera's "ka-chk". */
const CURTAIN_GAP_S = 0.038
/** The spring recharging after the second curtain lands. */
const CHARGE_S = 0.06

/** The gallery's sounds as data. */
const gallerySoundLayers = {
  // A focal-plane shutter: the first curtain, lower and heavier as it starts the cycle; the
  // second, brighter and lighter; then the charge, a muffled brush of the spring rewinding.
  // About 110 ms in all, inside the popup's 300 ms fade.
  open: [
    ...click(1700, 1.3),
    knock(170, 0.2),
    ...at(CURTAIN_GAP_S, [...click(2300, 1), knock(210, 0.12)]),
    ...at(CHARGE_S, [
      {
        source: { type: 'noise' },
        filter: [{ type: 'bandpass', frequency: 900, resonance: 1 }, HISS_CUT],
        envelope: { attack: 0.006, decay: 0.035 },
        gain: 0.35,
      },
    ]),
  ],
  // The shutter button rising under a lifted finger: one soft contact, lower than either
  // curtain, so it reads as the press undone rather than another picture taken.
  close: [...click(1300, 1.2), knock(150, 0.16)],
} satisfies Record<string, Layer[]>

const gallerySounds = {
  open: defineUiSound(gallerySoundLayers.open),
  close: defineUiSound(gallerySoundLayers.close),
}

/** Closing weighs less than opening. */
const CLOSE_LEVEL = 0.7

/** The Gallery overlay opened or closed. */
export function playGallerySound(open: boolean) {
  playSound(open ? gallerySounds.open : gallerySounds.close, {
    volume: LEVEL * (open ? 1 : CLOSE_LEVEL),
    jitter: { detune: 20, volume: 0.08 },
  })
}
