import type { DialConfig } from 'dialkit'

import type { WarpTuning } from './gallery-warp'

export const galleryWarpControls = {
  motion: { type: 'easing', duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  /** Seconds the corners start after the middle. */
  lead: [0.15, 0, 0.6, 0.01],
  /** Extra magnification of the middle halfway through a move. */
  bulge: [0, 0, 0.5, 0.01],
} satisfies DialConfig

const { motion, lead, bulge } = galleryWarpControls

// Production values; /dev/gallery-warp tunes these in DialKit.
export const defaultWarpTuning: WarpTuning = { motion, lead: lead[0], bulge: bulge[0] }
