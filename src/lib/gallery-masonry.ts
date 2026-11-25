/**
 * Splits items into masonry columns, as indices. The first `lead` items are a grid `leadColumns`
 * wide, row by row (the See more tile's), and each column takes `leadColumns / columns` of its
 * columns: item `row * leadColumns + column` joins column `column * columns / leadColumns`,
 * rounded down, so with as many columns as the grid it is row `row` of column `column`, and with
 * half as many each column takes two of the grid's, row by row. Each item after joins the
 * shortest column, measured by the items' heights at unit width.
 */
export function masonryColumns(
  heights: readonly number[],
  columns: number,
  lead: number,
  leadColumns: number,
): number[][] {
  const result = Array.from({ length: columns }, (): number[] => [])
  const totals = Array.from({ length: columns }, () => 0)
  for (const [index, height] of heights.entries()) {
    const column =
      index < lead
        ? Math.floor(((index % leadColumns) * columns) / leadColumns)
        : totals.indexOf(Math.min(...totals))
    result[column].push(index)
    totals[column] += height
  }
  return result
}
