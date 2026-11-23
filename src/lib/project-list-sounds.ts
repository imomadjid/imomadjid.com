import type { Layer } from '@web-kits/audio'

import { HISS_CUT, LEVEL, repeatDuck } from './theme-sounds'
import { defineUiSound, playSound } from './ui-sound'

// The project list's detent: a soft tick each time the active row changes, like a picker wheel
// passing a stop. Built like the wand's gear tooth (web-kits' Mechanical clicks): a few ms of
// band-passed noise over a faint sine body, nothing centred above 5 kHz. Moving up the list sits
// two semitones above moving down. It plays well under the wand's softest tooth, since it answers
// reading rather than doing.

/** One detent: a dry click, then a sine struck 50% sharp that settles onto `body` within ~12 ms. */
function detentLayers(center: number, body: number): Layer[] {
  return [
    {
      source: { type: 'noise' },
      filter: [{ type: 'bandpass', frequency: center, resonance: 3 }, HISS_CUT],
      envelope: { attack: 0.001, decay: 0.005 },
      gain: 1.1,
    },
    {
      source: { type: 'sine', frequency: { start: body * 1.5, end: body } },
      envelope: { attack: 0.001, decay: 0.012 },
      gain: 0.05,
    },
  ]
}

/** Two semitones apart: 2^(2/12) ≈ 1.12. */
const detents = {
  down: defineUiSound(detentLayers(3000, 1000)),
  up: defineUiSound(detentLayers(3360, 1120)),
}

/** The detent's level against the theme toggle's. */
const ROW_LEVEL = 0.4
/** A sweep across rows plays at most one tick per MIN_GAP_MS, about 22 a second. */
const MIN_GAP_MS = 45
/** Ticks 50 ms apart play half as loud, easing back to full by 220 ms. */
const rowDuck = repeatDuck(50, 220, 0.5)
let lastTickAt = -Infinity

/** The active row changed. `direction` is which way the reader moved through the list. */
export function playRowTick(direction: 'down' | 'up') {
  const now = performance.now()
  if (now - lastTickAt < MIN_GAP_MS) return
  lastTickAt = now
  // Hover and focus can't start audio; this plays once a gesture has.
  playSound(detents[direction], {
    volume: LEVEL * ROW_LEVEL * rowDuck(now),
    jitter: { detune: 25, volume: 0.1 },
  })
}
