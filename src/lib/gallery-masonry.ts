/**
 * Splits items into masonry columns, as indices. The first `lead` items are a grid as wide as the
 * columns, row by row (the See more tile's), so item `row * columns + column` is row `row` of
 * column `column`. Each item after joins the shortest column, measured by the items' heights at
 * unit width.
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
