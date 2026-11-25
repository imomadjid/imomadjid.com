import { useSyncExternalStore } from 'react'

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
// them, while the page behind holds still (holdPage). The backdrops stick, as the Sunlit layers
// do (ambient-light.tsx), 5rem past each end of the viewport, too tall to band the bars: they
// portal into a `contents` layer at the top of the body and stick in its flow. Negative margins
// as tall as each one, less the overscan, keep it out of that flow: the bottom one is what keeps
// it stuck at the end of the page, since a sticky box stays within its container by its margin
// box. The open photo's popup stays fixed, and its band covers the toolbar.

/** The id of the layer the Gallery's sticky dialogs portal into, the first child of the body. */
export const dialogLayerId = 'dialog-layer'

/** The id of the layer the See more overlay portals into, right after the dialog layer. */
export const overlayLayerId = 'overlay-layer'

/** A ref to a layer that Base UI reads only when a dialog mounts, on the client. */
function layerRef(id: string) {
  return {
    get current() {
      return document.getElementById(id)
    },
  }
}

/** The layer for the backdrops and the open photo. Without it Base UI portals to the body. */
export const dialogLayer = layerRef(dialogLayerId)

/** The layer for the See more overlay. */
export const overlayLayer = layerRef(overlayLayerId)

/**
 * A full-screen dialog backdrop's position: fixed over the viewport, or on touch screens stuck to
 * it and reaching 5rem past each end, too tall to band Safari's bars.
 */
export const dialogCoverClass =
  'fixed inset-0 pointer-coarse:sticky pointer-coarse:inset-auto pointer-coarse:-top-20 pointer-coarse:-mt-20 pointer-coarse:-mb-[calc(100lvh+5rem)] pointer-coarse:h-[calc(100lvh+10rem)]'

const coarseQuery = '(pointer: coarse)'

function subscribeCoarse(change: () => void) {
  const query = matchMedia(coarseQuery)
  query.addEventListener('change', change)
  return () => query.removeEventListener('change', change)
}

/** Whether the See more overlay scrolls the page (touch screens), rather than its own popup. */
export function useOverlayScrollsPage() {
  return useSyncExternalStore(
    subscribeCoarse,
    () => matchMedia(coarseQuery).matches,
    () => false,
  )
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
