// Where the Gallery's exposure readout sits under a full-screen photo, and how much room the
// photo leaves for it. Kept in step with ExposureReadout's classes (src/components/gallery-exposure.tsx).
import type { Rect } from '#/lib/gallery-flight-geometry'

/** The gap between the photo and the readout under it. */
const READOUT_GAP = 16
/** A row of cells: a label's line (leading-3.5), the gap under it (gap-0.5), a value's (leading-5). */
const ROW_HEIGHT = 14 + 2 + 20
/** The gap between the rows of a phone's grid (gap-y-3). */
const ROW_GAP = 12

/** Whether the readout lays its cells out as a phone's grid, three columns over two rows. */
const readoutGrid = (viewportWidth: number) => viewportWidth < 640

/** The gap between cells along a row: the grid's least, or the row's (gap-x-5, gap-x-8). */
const cellGap = (viewportWidth: number) => (readoutGrid(viewportWidth) ? 20 : 32)

/** What the photo leaves free under it for the readout: a row, or a phone's two. */
export function readoutSpace(viewportWidth: number) {
  const rows = readoutGrid(viewportWidth) ? 2 : 1
  return READOUT_GAP + rows * ROW_HEIGHT + (rows - 1) * ROW_GAP
}

/** Where the readout sits, and how wide it is. */
export type ReadoutRow = { x: number; y: number; width: number }

/**
 * Each cell's slot: as wide as the widest that cell takes under any photo of the set (`cells`,
 * each photo's cells' widths: the exposure's, then the recipe's if it has one), so stepping
 * between photos changes their values in place and never moves the cells after one that grows.
 */
export function readoutSlots(cells: readonly (readonly number[])[]) {
  const count = Math.max(0, ...cells.map((widths) => widths.length))
  return Array.from({ length: count }, (_, index) =>
    Math.max(0, ...cells.map((widths) => widths[index] ?? 0)),
  )
}

/** A phone's three columns' widths: column c holds cells c and c + 3, as wide as the wider. */
export const gridColumns = (slots: readonly number[]) =>
  [0, 1, 2].map((column) => Math.max(slots[column] ?? 0, slots[column + 3] ?? 0))

/** The least width the cells (`slots`) take: one row, or a phone's three columns. */
function cellsWidth(viewportWidth: number, slots: readonly number[]) {
  const gap = cellGap(viewportWidth)
  if (!readoutGrid(viewportWidth))
    return slots.reduce((sum, slot) => sum + slot + gap, slots.length > 0 ? -gap : 0)
  const [first, second, third] = gridColumns(slots)
  return first + second + third + 2 * gap
}

/**
 * The readout's bar under a full-screen photo you can step from to the others in its set: the
 * same for every photo, so stepping moves it only as far as the photo's bottom does, or, `pinned`
 * to the viewport's bottom margin (on a phone), not at all. It is as wide as the widest photo of
 * the set shows (`span`, a landscape one's), or wider where its cells (`slots`) need more room,
 * up to the viewport less its `margin` either side, centred on the viewport.
 */
export function readoutBar(
  viewport: Rect,
  margin: number,
  slots: readonly number[],
  span: number,
  photo: Rect | 'pinned',
): ReadoutRow {
  const room = viewport.width - 2 * margin
  const width = Math.min(room, Math.max(span, cellsWidth(viewport.width, slots)))
  return {
    x: viewport.x + (viewport.width - width) / 2,
    y:
      photo === 'pinned'
        ? viewport.y + viewport.height - margin - (readoutSpace(viewport.width) - READOUT_GAP)
        : photo.y + photo.height + READOUT_GAP,
    width,
  }
}
