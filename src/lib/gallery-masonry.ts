/**
 * Splits items into masonry columns, as indices. The first `lead` items are a grid as wide as the
 * columns, row by row (the See more tile's and those above it), so item `row * columns + column`
 * is row `row` of column `column`. Each item after joins the shortest column, measured by the
 * items' heights at unit width.
 */
export function masonryColumns(
  heights: readonly number[],
  columns: number,
  lead: number,
): number[][] {
  const result = Array.from({ length: columns }, (): number[] => [])
  const totals = Array.from({ length: columns }, () => 0)
  for (const [index, height] of heights.entries()) {
    const column = index < lead ? index % columns : totals.indexOf(Math.min(...totals))
    result[column].push(index)
    totals[column] += height
  }
  return result
}

/**
 * The See more tile's photos among the overlay's, `start` to `end`: its grid, as many cells square
 * as the overlay has columns, from row `startRow`, which leads the rows after it. On a phone one
 * row sits above, so its 2x2 flies out to the middle of the screen rather than its top; with four
 * columns none, since a 4x4 fills the screen.
 */
export function tileCells(columns: number) {
  const startRow = columns === 2 ? 1 : 0
  const start = startRow * columns
  return { startRow, start, end: start + columns * columns }
}
