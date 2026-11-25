// Checks that a postmark's lettering clears its borders, rings and outline, measured on the
// rendered glyphs rather than estimated, so a name that runs into a hexagon's edge shows up on
// /dev/postmarks. Each <text> names the shapes its caps must stay inside (`data-within`) and
// outside (`data-outside`, `;`-separated), as `e cx cy rx ry`, `r x y w h` or `p x y x y ...`.

type Point = readonly [number, number]

type Shape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'box'; x: number; y: number; w: number; h: number }
  | { kind: 'polygon'; points: Point[] }

// Allo's cap height, as postmark.tsx sets the lettering.
const capHeight = 0.73
// The ink filter shifts edges by up to a unit; anything closer than this reads as touching.
const margin = 1.5

export function parseShape(spec: string): Shape | undefined {
  const [kind, ...rest] = spec.trim().split(/\s+/)
  const values = rest.map(Number)
  if (values.some((value) => !Number.isFinite(value))) return undefined
  const [a = 0, b = 0, c = 0, d = 0] = values
  if (kind === 'e' && values.length === 4) return { kind: 'ellipse', cx: a, cy: b, rx: c, ry: d }
  if (kind === 'r' && values.length === 4) return { kind: 'box', x: a, y: b, w: c, h: d }
  if (kind === 'p' && values.length >= 6 && values.length % 2 === 0) {
    const points: Point[] = []
    for (let index = 0; index < values.length; index += 2) {
      points.push([values[index] ?? 0, values[index + 1] ?? 0])
    }
    return { kind: 'polygon', points }
  }
  return undefined
}

// How far `point` lies inside `shape`: positive inside, negative outside. Exact for boxes and
// convex polygons; for an ellipse, measured along the ray from its centre, which is exact for a
// circle and close enough for the stamps' gentle ovals.
export function depth(shape: Shape, [x, y]: Point) {
  if (shape.kind === 'ellipse') {
    const [dx, dy] = [x - shape.cx, y - shape.cy]
    const distance = Math.hypot(dx, dy)
    if (distance === 0) return Math.min(shape.rx, shape.ry)
    const reach = 1 / Math.hypot(dx / distance / shape.rx, dy / distance / shape.ry)
    return reach - distance
  }
  if (shape.kind === 'box') {
    return Math.min(x - shape.x, shape.x + shape.w - x, y - shape.y, shape.y + shape.h - y)
  }
  // Signed distance to each edge's line, inward positive whichever way the points wind.
  const { points } = shape
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index] ?? [0, 0]
    const [x2, y2] = points[(index + 1) % points.length] ?? [0, 0]
    area += x1 * y2 - x2 * y1
  }
  const winding = Math.sign(area) || 1
  let nearest = Number.POSITIVE_INFINITY
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index] ?? [0, 0]
    const [x2, y2] = points[(index + 1) % points.length] ?? [0, 0]
    const length = Math.hypot(x2 - x1, y2 - y1) || 1
    const side = (((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) / length) * winding
    nearest = Math.min(nearest, side)
  }
  return nearest
}

// The corners of each glyph's cap box in the SVG's user space: from its start to its end
// position along the baseline, and cap height up from there, following the glyph's rotation.
function glyphCorners(text: SVGTextContentElement) {
  const size = Number.parseFloat(text.getAttribute('font-size') ?? '') || 16
  const content = text.textContent ?? ''
  const corners: { char: string; points: Point[] }[] = []
  const count = text.getNumberOfChars()
  for (let index = 0; index < count; index += 1) {
    const char = content[index] ?? ''
    if (char.trim() === '') continue
    const start = text.getStartPositionOfChar(index)
    const end = text.getEndPositionOfChar(index)
    const angle = (text.getRotationOfChar(index) * Math.PI) / 180
    const [upX, upY] = [Math.sin(angle) * size * capHeight, -Math.cos(angle) * size * capHeight]
    corners.push({
      char,
      points: [
        [start.x, start.y],
        [end.x, end.y],
        [start.x + upX, start.y + upY],
        [end.x + upX, end.y + upY],
      ],
    })
  }
  return corners
}

// Checks every postmark under `root`, marks those whose lettering clashes with `data-clash`, and
// returns how many it checked, how many clashed, and each distinct clash once.
export function checkClearance(root: ParentNode) {
  const postmarks = [...root.querySelectorAll<SVGSVGElement>('svg[data-postmark]')]
  const messages = new Set<string>()
  let clashed = 0
  for (const postmark of postmarks) {
    let clashes = false
    for (const text of postmark.querySelectorAll<SVGTextElement>('text[data-within]')) {
      const within = parseShape(text.dataset.within ?? '')
      const outside = (text.dataset.outside ?? '')
        .split(';')
        .filter((spec) => spec.trim())
        .map(parseShape)
      const words = (text.textContent ?? '').trim()
      for (const { char, points } of glyphCorners(text)) {
        const deepest = Math.min(...points.map((point) => (within ? depth(within, point) : 0)))
        const intrusion = Math.max(
          ...outside.map((shape) =>
            shape ? Math.max(...points.map((point) => depth(shape, point))) : -margin,
          ),
          Number.NEGATIVE_INFINITY,
        )
        if (deepest < margin || intrusion > -margin) {
          const place = postmark.dataset.postmark ?? 'A postmark'
          const by =
            deepest < margin
              ? `${(margin - deepest).toFixed(1)} past its edge`
              : 'into a ring or outline'
          messages.add(`${place}: “${char}” in “${words}” runs ${by}`)
          clashes = true
          break
        }
      }
    }
    postmark.toggleAttribute('data-clash', clashes)
    if (clashes) clashed += 1
  }
  return { checked: postmarks.length, clashed, messages: [...messages] }
}
