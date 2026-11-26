import { easing, spring } from '#/lib/transition'

// The Gallery's motion: its tiles' zoom, a photo's flight out and back, the readout under it,
// stepping between photos, and the page receding behind them.
export const galleryTuning = {
  /** The See more tile's zoom out to the whole grid. */
  seeMore: {
    motion: easing(0.5, [0.22, 1, 0.36, 1]),
    /** Seconds the corners start after the middle. */
    lead: 0.15,
    /** Extra magnification of the middle halfway through a move. */
    bulge: 0,
  },
  /** A featured photo's zoom inside its tile on hover. */
  photo: {
    motion: easing(0.6, [0.22, 1, 0.36, 1]),
    lead: 0.12,
    /** How far the photo zooms in: 0.06 is 6%. */
    zoom: 0.06,
  },
  /**
   * A photo flying out of its tile, or the See more grid into the overlay, and back: a spring per
   * corner without bounce, its visual duration the corners' average response. It settles in about
   * one and a half responses.
   */
  expand: {
    open: spring(0.55),
    /** Back into the tile: quicker than the open. */
    close: spring(0.38),
    /**
     * How far the corners' responses spread either side of it on the most lopsided move: 0.5 is
     * half, as Apple spreads the rows of its app open.
     */
    spread: 0.5,
    /** Seconds a closed photo takes to fade into its tile, bringing the Sunlit light back in. */
    relight: 0.3,
  },
  /** The exposure readout under an open photo. */
  readout: {
    /**
     * How far into the photo's open it starts coming up, in the open's responses: before the
     * photo lands, so the two overlap rather than run one after the other.
     */
    start: 0.6,
    /** Each readout's rise, crossfade and unblur, on a spring without bounce as Apple's are. */
    motion: spring(0.45),
    /** Seconds each readout starts after the one before it. */
    stagger: 0.04,
  },
  /**
   * Stepping to the next or previous photo while one is open: the new photo fades up over the
   * last through a blur, each sliding a little the way the step goes, while the rounded outline
   * they show through moves from one photo's shape to the other's.
   */
  navigate: {
    /** The photos' slide and zoom, and the new one's fade where the outline narrows to it. */
    motion: spring(0.5),
    /**
     * The outline's move between a portrait and a landscape photo, the blur, and the readout
     * following the photo's bottom. No bounce: an outline that overshoots reads as a zoom.
     */
    frame: spring(0.45),
    /** The new photo's fade where the outline widens to it, so its sides arrive nearly opaque. */
    reveal: spring(0.3),
    /**
     * How far the photos slide, in px, the same for both, under photos 800 px wide or wider;
     * narrower sets (a phone) slide and blur in proportion.
     */
    shift: 14,
    /** How blurred a photo is at the far end of its crossfade, in px, scaled as `shift` is. */
    blur: 10,
  },
  /**
   * The page shrinking behind an open photo or the See more overlay, on Apple's Home Screen
   * spring (0.7s, damping ratio 0.88), and back on a quicker one.
   */
  recede: {
    /** How small the page gets: 0.94 is 94%. */
    scale: 0.94,
    open: spring(0.7, 0.12),
    close: spring(0.45),
  },
}

export type GalleryTuning = typeof galleryTuning
