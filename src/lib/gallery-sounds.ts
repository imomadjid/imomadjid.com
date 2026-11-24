import type { Effect, Layer } from '@web-kits/audio'

import { HISS_CUT, LEVEL, repeatDuck } from './theme-sounds'
import { defineUiSound, playSound } from './ui-sound'

// The Gallery breathes rather than clicks, after cuelume's open and close
// (github.com/danielwh2/cuelume, MIT): opening, a breath of air draws upward with glass swelling
// inside it, as a photo lifts toward the viewer; closing, the air falls shut over a low, damped
// mallet note, as it settles back into its tile. The glass is the light theme's, so the Gallery
// sounds like the rest of the page. One photo swells one note, E5; See more's sixteen swell the
// chord around it, C5, E5 and G5, strummed as the corners of its flight spread.
// Hovers, landings and the page recede stay silent: they finish what a press already voiced.
// Nothing is centred above 5 kHz. Envelope decays here reach about -26 dB at `decay` seconds.

/** Starts every layer `seconds` after the sound does. */
const at = (seconds: number, layers: Layer[]): Layer[] =>
  layers.map((layer) => ({ ...layer, delay: (layer.delay ?? 0) + seconds }))

/** Air moved by the photo: band-passed noise whose centre sweeps from `from` to `to` Hz. */
function air(from: number, to: number, sweep: number, attack: number, decay: number, gain: number) {
  const rising = to > from
  return {
    source: { type: 'noise' },
    // web-kits sweeps a filter up to its envelope's peak and back down to its base, so a rising
    // breath peaks at `to` and stays near it; a falling one starts there and falls to `to`.
    filter: [
      {
        type: 'bandpass',
        frequency: rising ? from : to,
        resonance: 1.4,
        envelope: rising
          ? { attack: sweep, peak: to, decay: 1 }
          : { attack: 0, peak: from, decay: sweep },
      },
      HISS_CUT,
    ],
    envelope: { attack, decay },
    gain,
  } satisfies Layer
}

/**
 * A glass note that swells in rather than striking: the fundamental and the free bar's 2.76x mode,
 * which dies first, as the light theme's glass does.
 */
const swell = (frequency: number, gain: number, decay: number): Layer[] => [
  { source: { type: 'sine', frequency }, envelope: { attack: 0.05, decay }, gain },
  {
    source: { type: 'sine', frequency: frequency * 2.76 },
    envelope: { attack: 0.04, decay: decay * 0.4 },
    gain: gain * 0.18,
  },
]

/** A low mallet note, damped: the fundamental and a marimba bar's 3.99x mode. */
const mallet = (frequency: number, gain: number, decay: number): Layer[] => [
  { source: { type: 'sine', frequency }, envelope: { attack: 0.003, decay }, gain },
  {
    source: { type: 'sine', frequency: frequency * 3.99 },
    envelope: { attack: 0.002, decay: decay * 0.4 },
    gain: gain * 0.2,
  },
]

/** A soft thud of the photo meeting its place. */
const thud = (frequency: number, gain: number, decay: number): Layer => ({
  source: { type: 'noise' },
  filter: { type: 'bandpass', frequency, resonance: 2 },
  envelope: { attack: 0.001, decay },
  gain,
})

const E5 = 659.25
const C5 = 523.25
const G5 = 783.99
const C4 = 261.63
const C3 = 130.81

const gallerySoundLayers = {
  // About 0.2 s, rising through the first third of the photo's 0.55 s flight.
  open: [air(600, 1500, 0.1, 0.05, 0.05, 0.9), ...swell(E5, 0.06, 0.12)],
  // Wider and a little longer: the chord strums 30 ms a note, low to high.
  seeMore: [
    air(450, 1300, 0.16, 0.08, 0.07, 1),
    ...swell(C5, 0.045, 0.14),
    ...at(0.03, swell(E5, 0.04, 0.13)),
    ...at(0.06, swell(G5, 0.035, 0.12)),
  ],
  close: [air(1400, 540, 0.07, 0.02, 0.03, 1.1), ...mallet(C4, 0.09, 0.045), thud(350, 0.7, 0.012)],
  // The same fall, over a lower mallet too: sixteen photos weigh more than one.
  seeMoreClose: [
    air(1400, 480, 0.09, 0.02, 0.035, 1.1),
    ...mallet(C4, 0.08, 0.05),
    ...mallet(C3, 0.08, 0.06),
    thud(165, 0.9, 0.016),
  ],
} satisfies Record<string, Layer[]>

/**
 * cuelume's small room: a quarter second, darkened, about 22 dB under the sound, so the photo
 * moves through a space rather than a speaker. Too short to hear as an echo.
 */
const ROOM = [
  { type: 'reverb', decay: 0.25, preDelay: 0.008, damping: 0.6, mix: 0.08 },
] satisfies Effect[]

const sounds = {
  open: defineUiSound(gallerySoundLayers.open, ROOM),
  seeMore: defineUiSound(gallerySoundLayers.seeMore, ROOM),
  close: defineUiSound(gallerySoundLayers.close, ROOM),
  seeMoreClose: defineUiSound(gallerySoundLayers.seeMoreClose, ROOM),
}

/**
 * Against the theme toggle's level: a breath carries more energy than a click, so over 100 ms
 * the opens sit about 1.5 dB under the toggle and the closes about 2.5 dB under, as navigation
 * should sit under a control.
 */
const GALLERY_LEVEL = 0.55

/** Opens and closes faster than 120 ms apart play 30% softer, easing back to full by 300 ms. */
const duck = repeatDuck(120, 300, 0.3)

/** A Gallery photo opens full screen, or (`seeMore`) the See more overlay opens. */
export function playGalleryOpen(seeMore = false) {
  playSound(seeMore ? sounds.seeMore : sounds.open, {
    volume: LEVEL * GALLERY_LEVEL * duck(performance.now()),
    jitter: { detune: 10, volume: 0.08 },
  })
}

/** A Gallery photo, or (`seeMore`) the See more overlay, starts to close. */
export function playGalleryClose(seeMore = false) {
  playSound(seeMore ? sounds.seeMoreClose : sounds.close, {
    volume: LEVEL * GALLERY_LEVEL * duck(performance.now()),
    jitter: { detune: 10, volume: 0.08 },
  })
}
