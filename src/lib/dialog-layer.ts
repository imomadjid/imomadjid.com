import { coarsePointerQuery, useMediaQuery } from '#/lib/media-query'
import { tw } from '#/lib/tw'

// iOS Safari 26+ doesn't draw fixed or sticky layers under its status bar and floating toolbar:
// only the page's flow reaches there. Worse, it hit-tests the middle of each edge, and where it
// finds a fixed or sticky layer about the viewport's size, or a dimming layer (a translucent
// background with no children, at any size), it covers the area under that bar with an opaque
// band: the layer's colour over the page's, or the page's own where the layer has a
// backdrop-filter (WebKit's LocalFrameView::fixedContainerEdges). A layer at least 5% taller than
// the viewport that isn't a dimming layer doesn't count. And it collapses its toolbar only when
// the page itself scrolls, never a scrolling layer over it.
//
// So on touch screens the See more overlay's photos lie in the body's flow and the page scrolls
// them, while the page behind holds still (holdPage). The backdrops reach 5rem past each end of
// the viewport, too tall to band the bars. The open photo's popup stays viewport-sized, and its
// band covers the toolbar.

/**
 * The id of the layer the See more overlay portals into: the body's first child, so on touch
 * screens its photos come first in the page's flow.
 */
export const overlayLayerId = 'overlay-layer'

/** The overlay's layer, as a ref Base UI reads when the dialog mounts, on the client. */
export const overlayLayer = {
  get current() {
    return document.getElementById(overlayLayerId)
  },
}

/** A full-screen dialog backdrop's box: the viewport and 5rem past each end, so it bands no bar. */
export const dialogCoverClass = tw('fixed inset-x-0 -top-20 h-[calc(100lvh+10rem)]')

/** Whether the See more overlay scrolls the page (touch screens), rather than its own popup. */
export function useOverlayScrollsPage() {
  return useMediaQuery(coarsePointerQuery)
}

/**
 * Holds the page (`main`) where it shows while the See more overlay scrolls the page over it:
 * fixed at its scroll, which goes back to the top for the overlay. Returns the release, which puts
 * the page and its scroll back as they were; run it once the overlay has left the flow.
 */
export function holdPage(): () => void {
  const page = document.querySelector('main')
  if (!page) return () => {}
  const top = window.scrollY
  Object.assign(page.style, { position: 'fixed', top: `${-top}px`, left: '0', right: '0' })
  window.scrollTo({ top: 0, behavior: 'instant' })
  return () => {
    Object.assign(page.style, { position: '', top: '', left: '', right: '' })
    window.scrollTo({ top, behavior: 'instant' })
  }
}
