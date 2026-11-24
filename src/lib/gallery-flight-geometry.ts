// Geometry for a photo expanding from its tile to a full-screen view, one corner at a time.

export type Rect = { x: number; y: number; width: number; height: number }
export type Point = readonly [x: number, y: number]
/** Corners in the order top left, top right, bottom right, bottom left. */
export type Quad = readonly [Point, Point, Point, Point]

export function quadOf({ x, y, width, height }: Rect): Quad {
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ]
}

export type Insets = { top: number; right: number; bottom: number; left: number }

/** The largest rect with `aspect` (width / height) that fits `bounds` less `insets`, centred. */
export function containRect(bounds: Rect, aspect: number, insets: Insets): Rect {
  const room = {
    x: bounds.x + insets.left,
    y: bounds.y + insets.top,
    width: Math.max(0, bounds.width - insets.left - insets.right),
    height: Math.max(0, bounds.height - insets.top - insets.bottom),
  }
  const width = Math.min(room.width, room.height * aspect)
  const height = width / aspect
  return {
    x: room.x + (room.width - width) / 2,
    y: room.y + (room.height - height) / 2,
    width,
    height,
  }
}

/**
 * The part of an image, in 0 to 1 texture coordinates, that `object-fit: cover` shows in a box:
 * the image's middle, cropped to the box's aspect.
 */
export function coverCrop(imageAspect: number, boxAspect: number): Rect {
  if (imageAspect > boxAspect) {
    const width = boxAspect / imageAspect
    return { x: (1 - width) / 2, y: 0, width, height: 1 }
  }
  const height = imageAspect / boxAspect
  return { x: 0, y: (1 - height) / 2, width: 1, height }
}

export const wholeImage: Rect = { x: 0, y: 0, width: 1, height: 1 }

/**
 * How far each corner lags the one that leads, from 0 (it leads) to 1: how much farther or nearer
 * than the leader it is from its partner in `toward`, over `scale` (the viewport's diagonal), up
 * to 1. Opening, the corner with the farthest to go leads and stretches the photo out; closing,
 * the nearest leads and the far side trails in behind it, funnelling the photo home, as Apple's
 * app open and close do. Corners as far as each other move together, so a tile centred across the
 * screen moves its top or bottom edge as one, and the lag grows the more lopsided the move is.
 */
export function cornerLags(
  from: readonly Point[],
  toward: readonly Point[],
  scale: number,
  lead: 'farthest' | 'nearest' = 'farthest',
): number[] {
  const distances = from.map((point, i) =>
    Math.hypot(toward[i][0] - point[0], toward[i][1] - point[1]),
  )
  const leader = lead === 'farthest' ? Math.max(...distances) : Math.min(...distances)
  return distances.map((distance) =>
    scale > 0 ? Math.min(1, Math.abs(leader - distance) / scale) : 0,
  )
}

/** The length of a rect's diagonal. */
export function diagonal(rect: Rect) {
  return Math.hypot(rect.width, rect.height)
}
