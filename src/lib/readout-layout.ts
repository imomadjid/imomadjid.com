// Where the Gallery's exposure readout sits under a full-screen photo, and how much room the
// photo leaves for it. Kept in step with ExposureReadout's classes (src/components/gallery-exposure.tsx).
import type { Rect } from '#/lib/gallery-flight-geometry'

/** The gap between the photo and the readout under it. */
const READOUT_GAP = 12
/** The readout's line height (leading-5) and the gap between its lines (gap-y-1). */
const LINE_HEIGHT = 20
const LINE_GAP = 4

/** The gap between readouts along a line: wider from sm up. */
const readoutGap = (viewportWidth: number) => (viewportWidth < 640 ? 16 : 24)

/** What the photo leaves free under it for a readout of `lines` lines. */
export const readoutSpace = (lines: number) =>
  READOUT_GAP + lines * LINE_HEIGHT + (lines - 1) * LINE_GAP

/**
 * How many lines a row of items `widths` wide breaks into in `width`, `gap` apart, as
 * `flex-wrap` breaks them: each line takes items until the next would overflow it. An item wider
 * than the row still takes a line of its own.
 */
export function wrapLines(widths: readonly number[], width: number, gap: number) {
  let lines = 0
  let used = 0
  for (const itemWidth of widths) {
    if (lines === 0 || used + gap + itemWidth > width) {
      lines += 1
      used = itemWidth
    } else {
      used += gap + itemWidth
    }
  }
  return Math.max(1, lines)
}

/** Where the readout sits, how many lines it takes, and its items' gap along a line. */
export type ReadoutRow = { x: number; y: number; width: number; lines: number; gap: number }

/**
 * The readout's row: as wide as the photo, or wider, centred under it, where its items (`widths`)
 * need more room for one line, up to the viewport less its `margin` either side. They wrap only
 * past that, as on a phone, so the line count doesn't depend on the photo: `photo` may be left
 * out to get it before the photo is placed. Unmeasured (`widths` empty), it takes a line.
 */
export function readoutRow(
  viewport: Rect,
  margin: number,
  widths: readonly number[],
  photo: Rect = { x: margin, y: 0, width: 0, height: 0 },
): ReadoutRow {
  const gap = readoutGap(viewport.width)
  const room = viewport.width - 2 * margin
  const oneLine = widths.reduce((sum, width) => sum + width + gap, -gap)
  const width = Math.min(room, Math.max(photo.width, oneLine))
  const centred = photo.x + (photo.width - width) / 2
  return {
    x: Math.min(Math.max(centred, margin), viewport.width - margin - width),
    y: photo.y + photo.height + READOUT_GAP,
    width,
    lines: oneLine <= room ? 1 : wrapLines(widths, room, gap),
    gap,
  }
}
