// iOS Safari 26+ doesn't draw fixed layers under its status bar and floating toolbar, so a fixed
// full-screen dialog ends at the toolbar's top edge and the page shows below it, unblurred. On touch
// screens the Gallery's dialogs stick instead, as the Sunlit layers do (ambient-light.tsx): they
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
