import type { DialConfig, ResolvedValues } from 'dialkit'

export const galleryControls = {
  /** The See more tile's zoom out to the whole grid. */
  seeMore: {
    motion: { type: 'easing', duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    /** Seconds the corners start after the middle. */
    lead: [0.15, 0, 0.6, 0.01],
    /** Extra magnification of the middle halfway through a move. */
    bulge: [0, 0, 0.5, 0.01],
  },
  /** A featured photo's zoom inside its tile on hover. */
  photo: {
    motion: { type: 'easing', duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    lead: [0.12, 0, 0.5, 0.01],
    /** How far the photo zooms in: 0.06 is 6%. */
    zoom: [0.06, 0, 0.2, 0.005],
  },
  /** A photo expanding to full screen, corners starting by how far each has to go. */
  expand: {
    motion: { type: 'easing', duration: 0.8, ease: [0.32, 0.72, 0, 1] },
    /** Seconds the nearest corner can trail the farthest, for a move across the whole screen. */
    spread: [0.12, 0, 0.5, 0.005],
  },
} satisfies DialConfig

export type GalleryTuning = ResolvedValues<typeof galleryControls>

const { seeMore, photo, expand } = galleryControls

// Production values; DialKit's Gallery panel tunes these in development.
export const defaultGalleryTuning: GalleryTuning = {
  seeMore: { motion: seeMore.motion, lead: seeMore.lead[0], bulge: seeMore.bulge[0] },
  photo: { motion: photo.motion, lead: photo.lead[0], zoom: photo.zoom[0] },
  expand: { motion: expand.motion, spread: expand.spread[0] },
}
