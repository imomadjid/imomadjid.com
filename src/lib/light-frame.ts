// The Sunlit scene is laid out on a frame the size of the large viewport, at its top. Touch
// layouts extend the canvas past both ends of that frame by its negative top margin, so the light
// reaches under Safari's status bar and toolbar, which clip fixed layers at the viewport.

/** How far the canvas reaches past each end of the frame, in CSS pixels. */
export function lightOverscan(canvas: Element) {
  return Math.max(0, -Number.parseFloat(getComputedStyle(canvas).marginTop) || 0)
}

export type LightFrame = {
  left: number
  top: number
  width: number
  height: number
  /** The canvas's top edge and height in frame heights, for mapping canvas UV into the frame. */
  viewTop: number
  viewSpan: number
}

/** The light's frame in client pixels: the canvas without its overscan. */
export function lightFrame(canvas: Element, overscan: number): LightFrame {
  const rect = canvas.getBoundingClientRect()
  const height = Math.max(rect.height - 2 * overscan, 1)
  return {
    left: rect.left,
    top: rect.top + overscan,
    width: Math.max(rect.width, 1),
    height,
    viewTop: -overscan / height,
    viewSpan: rect.height / height,
  }
}
