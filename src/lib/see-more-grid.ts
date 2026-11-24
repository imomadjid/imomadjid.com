import type { Rect } from '#/lib/gallery-flight-geometry'

// The See more tile's 4x4 grid at 1x, in CSS pixels: gap-0.5 and rounded-md cells.
export const SEE_MORE_GAP = 2
export const SEE_MORE_CELL_RADIUS = 6

/** How far the resting tile magnifies its grid: the middle two cells and one gap fill it. */
export function seeMoreRestZoom(width: number) {
  return (2 * width) / (width - SEE_MORE_GAP)
}

/**
 * Where cell `index` (row by row) of the tile's grid sits on screen when the grid is magnified
 * `zoom` times about the tile's middle. Cells may lie outside the tile, which clips them.
 */
export function seeMoreCellRect(tile: Rect, index: number, zoom: number): Rect {
  const cell = (tile.width - 3 * SEE_MORE_GAP) / 4
  const pitch = cell + SEE_MORE_GAP
  const middleX = tile.x + tile.width / 2
  const middleY = tile.y + tile.height / 2
  return {
    x: middleX + ((index % 4) * pitch - tile.width / 2) * zoom,
    y: middleY + (Math.floor(index / 4) * pitch - tile.height / 2) * zoom,
    width: cell * zoom,
    height: cell * zoom,
  }
}
