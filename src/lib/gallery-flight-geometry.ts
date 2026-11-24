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
 * The order the corners move in: the one farthest from its partner in `toward` first, then the
 * rest by falling distance. Opening ranks the tile's corners against the viewport's, so the
 * corner with the longest way to its side of the screen leads.
 */
export function cornerOrder(from: Quad, toward: Quad): number[] {
  const distance = (i: number) => Math.hypot(toward[i][0] - from[i][0], toward[i][1] - from[i][1])
  return [0, 1, 2, 3].sort((a, b) => distance(b) - distance(a) || a - b)
}

/** `from` moved toward `to` by `amount` (0 stays, 1 arrives). */
export function mixPoint(from: Point, to: Point, amount: number): Point {
  return [from[0] + (to[0] - from[0]) * amount, from[1] + (to[1] - from[1]) * amount]
}
