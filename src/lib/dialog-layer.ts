// iOS Safari 26+ doesn't draw fixed layers under its status bar and floating toolbar. Worse, it
// hit-tests the middle of each edge, and where it finds a fixed or sticky layer about the
// viewport's size, or a dimming layer (a translucent background with no children, at any size),
// it covers the area under that bar with an opaque band: the layer's colour over the page's, or
// the page's own where the layer has a backdrop-filter (WebKit's LocalFrameView::
// fixedContainerEdges). A full-screen dialog's photos then stop at the band. A layer at least 5%
// taller than the viewport that isn't a dimming layer doesn't count, and a scrolling layer without
// a background isn't hit at all, so Safari leaves the bars clear. On touch screens the Gallery's
// dialogs stick, as the Sunlit layers do (ambient-light.tsx), and so reach that size: they
// portal into a `contents` layer at the top of the body, so they stick in the body's flow, reaching
// 5rem past each end of the viewport. A negative top margin as tall as each one keeps it out of
// that flow: only a top margin, since two in a row would collapse a bottom one into the next's top,
// and the body is a flow root, so the first one's doesn't collapse through it.

/** The id of the layer the Gallery's dialogs portal into, the first child of the body. */
export const dialogLayerId = 'dialog-layer'

/**
 * The layer, as a ref Base UI reads only when a dialog mounts, on the client. Without the layer it
 * portals to the body.
 */
export const dialogLayer = {
  get current() {
    return document.getElementById(dialogLayerId)
  },
}

/**
 * A full-screen dialog layer's position: fixed over the viewport, or on touch screens stuck to it
 * and reaching 5rem past each end. Lay what's inside out within `dialogOverscanClass`.
 */
export const dialogCoverClass =
  'fixed inset-0 pointer-coarse:sticky pointer-coarse:inset-auto pointer-coarse:-top-20 pointer-coarse:-mt-[calc(100lvh+10rem)] pointer-coarse:h-[calc(100lvh+10rem)]'

/** Padding that keeps a stuck dialog's content off its overscan, where the viewport would cut it. */
export const dialogOverscanClass = 'pointer-coarse:py-20'
