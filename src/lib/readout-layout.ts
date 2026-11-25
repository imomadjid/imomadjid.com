// Where the Gallery's exposure readout sits under a full-screen photo, and how much room the
// photo leaves for it. Kept in step with ExposureReadout's classes (src/components/gallery-exposure.tsx).
import type { Rect } from '#/lib/gallery-flight-geometry'

/** The gap between the photo and the readout under it. */
const READOUT_GAP = 16
/** A row of cells: a label's line (leading-3.5), the gap under it (gap-0.5), a value's (leading-5). */
const ROW_HEIGHT = 14 + 2 + 20
/** The gap between the rows of a phone's grid (gap-y-3). */
const ROW_GAP = 12

/** Whether a viewport `viewportWidth` wide is a phone's: its readout is a grid pinned to the bottom. */
export const readoutGrid = (viewportWidth: number) => viewportWidth < 640

/** What the photo leaves free under it for the readout: a row, or a phone's two. */
export function readoutSpace(viewportWidth: number) {
  const rows = readoutGrid(viewportWidth) ? 2 : 1
  return READOUT_GAP + rows * ROW_HEIGHT + (rows - 1) * ROW_GAP
}

/**
 * Where the readout's bar sits: centred on `center`, `y` from the top, and as wide as its cells
 * take, but no narrower than `minWidth` nor wider than `maxWidth`; `grid` on a phone.
 */
export type ReadoutRow = {
  center: number
  y: number
  minWidth: number
  maxWidth: number
  grid: boolean
}

/**
 * The readout's bar under a full-screen photo you can step from to the others in its set: the
 * same for every photo, so stepping moves it only as far as the photo's bottom does, or, pinned to
 * the viewport's bottom margin on a phone, not at all. It is at least as wide as the widest photo
 * of the set shows (`span`, a landscape one's), so a portrait photo narrows the photo but not the
 * bar, and wider where its cells need it, up to the viewport less its `margin` either side,
 * centred on the viewport.
 */
export function readoutBar(viewport: Rect, margin: number, span: number, photo: Rect): ReadoutRow {
  const grid = readoutGrid(viewport.width)
  const maxWidth = viewport.width - 2 * margin
  return {
    center: viewport.x + viewport.width / 2,
    y: grid
      ? viewport.y + viewport.height - margin - (readoutSpace(viewport.width) - READOUT_GAP)
      : photo.y + photo.height + READOUT_GAP,
    minWidth: Math.min(span, maxWidth),
    maxWidth,
    grid,
  }
}
