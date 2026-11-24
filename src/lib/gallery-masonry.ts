/**
 * Splits items into masonry columns, as indices. The first `columns * leadRows` go round the
 * columns in turn, so item `row * columns + column` is row `row` of column `column`, as in a grid.
 * Each one after joins the shortest column, measured by the items' heights at unit width.
 */
export function masonryColumns(
  heights: readonly number[],
  columns: number,
  leadRows: number,
): number[][] {
  const result = Array.from({ length: columns }, (): number[] => [])
  const totals = Array.from({ length: columns }, () => 0)
  for (const [index, height] of heights.entries()) {
    const column =
      index < columns * leadRows ? index % columns : totals.indexOf(Math.min(...totals))
    result[column].push(index)
    totals[column] += height
  }
  return result
}
