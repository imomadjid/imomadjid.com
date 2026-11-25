// What live glass (#/lib/live-glass) refracts, kept apart from the renderer so components can
// describe their backdrop without loading WebGPU code.

/** How far past the shape the canvas reaches, for the drop shadow and hairline, in CSS px. */
export const LIVE_GLASS_MARGIN = 12

export type LiveGlassPhoto = {
  image: HTMLImageElement
  /** Its box in the viewport, CSS pixels. */
  rect: DOMRectReadOnly
  radius: number
}

export type LiveGlassScene = {
  /** Any CSS colour: what shows where no photo is. */
  background: string
  photos: readonly LiveGlassPhoto[]
}

/** What lies behind live glass, read on every frame it draws. */
export type LiveGlassSource = {
  /** The scene, at least within `near` (viewport CSS pixels); photos past it are skipped. */
  scene: (near: DOMRectReadOnly) => LiveGlassScene
  /** Calls `wake` whenever the scene may have changed; returns the unsubscribe. */
  subscribe: (wake: (change?: LiveGlassChange) => void) => () => void
}

export type LiveGlassChange = {
  /**
   * The browser scrolled the photos, off the main thread for a person's touch, wheel or trackpad
   * (in Chrome), so the screen shows them a frame past the rects the scene reads. While they keep
   * scrolling, the glass draws them a frame ahead to match.
   */
  scrolled?: boolean
}
