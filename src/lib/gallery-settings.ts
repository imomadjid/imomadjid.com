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
  /**
   * A photo flying out of its tile, or the See more grid into the overlay, and back: a spring per
   * corner without bounce, its visual duration the corners' average response. It settles in about
   * one and a half responses.
   */
  expand: {
    open: { type: 'spring', visualDuration: 0.55, bounce: 0 },
    /** Back into the tile: quicker than the open. */
    close: { type: 'spring', visualDuration: 0.38, bounce: 0 },
    /**
     * How far the corners' responses spread either side of it on the most lopsided move: 0.5 is
     * half, as Apple spreads the rows of its app open.
     */
    spread: [0.5, 0, 0.9, 0.01],
    /** Seconds a closed photo takes to fade into its tile, bringing the Sunlit light back in. */
    relight: [0.3, 0, 1, 0.05],
  },
  /**
   * The page shrinking behind an open photo or the See more overlay, on Apple's Home Screen
   * spring (0.7s, damping ratio 0.88), and back on a quicker one.
   */
  recede: {
    /** How small the page gets: 0.94 is 94%. */
    scale: [0.94, 0.8, 1, 0.005],
    open: { type: 'spring', visualDuration: 0.7, bounce: 0.12 },
    close: { type: 'spring', visualDuration: 0.45, bounce: 0 },
  },
} satisfies DialConfig

export type GalleryTuning = ResolvedValues<typeof galleryControls>

const { seeMore, photo, expand, recede } = galleryControls

// Production values; DialKit's Gallery panel tunes these in development.
export const defaultGalleryTuning: GalleryTuning = {
  seeMore: { motion: seeMore.motion, lead: seeMore.lead[0], bulge: seeMore.bulge[0] },
  photo: { motion: photo.motion, lead: photo.lead[0], zoom: photo.zoom[0] },
  expand: {
    open: expand.open,
    close: expand.close,
    spread: expand.spread[0],
    relight: expand.relight[0],
  },
  recede: { scale: recede.scale[0], open: recede.open, close: recede.close },
}
