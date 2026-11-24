import type { Layer } from '@web-kits/audio'

import { HISS_CUT, LEVEL, repeatDuck } from './theme-sounds'
import { defineUiSound, playSound } from './ui-sound'

// The Gallery plays like a good keyboard: dry thocks, no ring and no room. Built from cuelume's
// keystroke (github.com/danielwh2/cuelume, MIT): the switch's click, the keycap's clack and the
// thock of bottoming out, each a few ms of band-passed noise, over a sine knock struck sharp that
// drops onto the key's body. Hovering a photo touches a key: a light detent over a small knock.
// Opening a photo presses one; See more presses the spacebar, wider and deeper. Closing lets the
// key settle back: softer and lower, with almost no click.
// Nothing is centred above 5 kHz. Decays are cuelume's 60 dB ring times scaled to web-kits',
// whose envelopes reach about -26 dB at `decay` seconds: 0.434 of cuelume's.

/** A few ms of band-passed noise: a click, clack or thock depending on where it's centred. */
const band = (frequency: number, q: number, decay: number, gain: number): Layer => ({
  source: { type: 'noise' },
  filter: [{ type: 'bandpass', frequency, resonance: q }, HISS_CUT],
  envelope: { attack: 0.001, decay },
  gain,
})

/** A key's body: a sine struck 60% sharp that drops onto `frequency`, heard as a "tok". */
const knock = (frequency: number, decay: number, gain: number): Layer => ({
  source: { type: 'sine', frequency: { start: frequency * 1.6, end: frequency } },
  envelope: { attack: 0.001, decay },
  gain,
})

const gallerySoundLayers = {
  // cuelume's list detent: a crisp tick over a small wooden knock.
  hover: [band(2800, 2.2, 0.0033, 0.16), knock(415, 0.0084, 0.03)],
  // A keycap bottoming out: click, clack, then the thock and the body under it.
  open: [
    band(3900, 0.8, 0.0022, 0.08),
    band(1550, 3.5, 0.0063, 0.22),
    band(310, 2.5, 0.011, 0.35),
    band(140, 2, 0.024, 0.45),
    knock(305, 0.0125, 0.04),
    knock(150, 0.03, 0.03),
  ],
  // The spacebar: the same stroke on a longer key, so a lower clack and a deeper thock.
  seeMore: [
    band(3600, 0.8, 0.0022, 0.07),
    band(1200, 3, 0.007, 0.22),
    band(230, 2.5, 0.014, 0.42),
    band(110, 2, 0.03, 0.5),
    knock(220, 0.015, 0.045),
    knock(110, 0.036, 0.04),
  ],
  // The key coming to rest: a muted clack and a low thock, the click all but gone.
  close: [
    band(2800, 2, 0.0013, 0.05),
    band(1000, 4, 0.0039, 0.2),
    band(180, 2, 0.02, 0.35),
    knock(131, 0.03, 0.05),
  ],
  // The spacebar coming to rest, a step lower.
  seeMoreClose: [
    band(2400, 2, 0.0013, 0.05),
    band(800, 4, 0.0045, 0.2),
    band(130, 2, 0.024, 0.4),
    knock(98, 0.036, 0.055),
  ],
} satisfies Record<string, Layer[]>

/**
 * Each sound's trim in dB, measured over its loudest 30 ms against the theme toggle's: a photo's
 * press matches it, the spacebar sits 1 dB over, the closes 2 dB under, and a hover 11 dB under,
 * as it only answers reading. cuelume's levels are relative to its own master gain, hence the
 * large trims.
 */
const TRIM_DB = { hover: 9.2, open: 13.4, seeMore: 12.6, close: 9.7, seeMoreClose: 8.7 }

const trimmed = (name: keyof typeof gallerySoundLayers) =>
  defineUiSound(
    gallerySoundLayers[name].map((layer) => ({
      ...layer,
      gain: (layer.gain ?? 0.5) * 10 ** (TRIM_DB[name] / 20),
    })),
  )

const sounds = {
  hover: trimmed('hover'),
  open: trimmed('open'),
  seeMore: trimmed('seeMore'),
  close: trimmed('close'),
  seeMoreClose: trimmed('seeMoreClose'),
}

const jitter = { detune: 30, volume: 0.12 }

/** Opens and closes faster than 120 ms apart play 30% softer, easing back to full by 300 ms. */
const pressDuck = repeatDuck(120, 300, 0.3)
/** Sweeping across the photos ticks at most every 45 ms, quick ones softer. */
const HOVER_GAP_MS = 45
const hoverDuck = repeatDuck(50, 220, 0.5)
/** A hover this soon after a press is the press's own focus coming back: it stays quiet. */
const HOVER_AFTER_PRESS_MS = 400
let lastHoverAt = -Infinity
let lastPressAt = -Infinity

function press(sound: (typeof sounds)[keyof typeof sounds]) {
  const now = performance.now()
  lastPressAt = now
  playSound(sound, { volume: LEVEL * pressDuck(now), jitter })
}

/** A pointer (not touch) or keyboard focus lands on a Gallery photo or the See more tile. */
export function playGalleryHover() {
  const now = performance.now()
  if (now - lastHoverAt < HOVER_GAP_MS || now - lastPressAt < HOVER_AFTER_PRESS_MS) return
  lastHoverAt = now
  // Hover and focus can't start audio; this plays once a gesture has.
  playSound(sounds.hover, { volume: LEVEL * hoverDuck(now), jitter })
}

/** A Gallery photo opens full screen, or (`seeMore`) the See more overlay opens. */
export function playGalleryOpen(seeMore = false) {
  press(seeMore ? sounds.seeMore : sounds.open)
}

/** A Gallery photo, or (`seeMore`) the See more overlay, starts to close. */
export function playGalleryClose(seeMore = false) {
  press(seeMore ? sounds.seeMoreClose : sounds.close)
}
