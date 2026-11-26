import { inkHeights } from './postmark-kit'

// Checks that a postmark's lettering clears its borders, rings and outline, measured on the
// rendered glyphs rather than estimated, so a name that runs into a hexagon's edge shows up on
// /dev/postmarks. Each <text> names the shapes its glyphs must stay inside (`data-within`) and
// outside (`data-outside`, `;`-separated), as `e cx cy rx ry`, `r x y w h` or `p x y x y ...`.
// Every line must also clear the postmark's ornaments (`data-keepout`) and its other lines.
// Each glyph is boxed from its advance and its own measured ink heights, so an accent or a
// cedilla counts.

type Point = readonly [number, number]

type Shape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'box'; x: number; y: number; w: number; h: number }
  | { kind: 'polygon'; points: Point[] }

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

// Each glyph's ink box in the SVG's user space, corners in order: along the baseline from its
// start to its end position (less the letter-spacing browsers add after it), and from its
// descent below the baseline to its ascent above, following the glyph's rotation.
function glyphBoxes(text: SVGTextContentElement) {
  const size = Number.parseFloat(text.getAttribute('font-size') ?? '') || 16
  const spacing = (Number.parseFloat(text.getAttribute('letter-spacing') ?? '') || 0) * size
  const content = text.textContent ?? ''
  const boxes: { char: string; points: Point[] }[] = []
  const count = text.getNumberOfChars()
  for (let index = 0; index < count; index += 1) {
    const char = content[index] ?? ''
    if (char.trim() === '') continue
    const start = text.getStartPositionOfChar(index)
    const end = text.getEndPositionOfChar(index)
    const angle = (text.getRotationOfChar(index) * Math.PI) / 180
    const [alongX, alongY] = [Math.cos(angle), Math.sin(angle)]
    const [upX, upY] = [Math.sin(angle), -Math.cos(angle)]
    const { ascent, descent } = inkHeights(char)
    const [x1, y1] = [start.x, start.y]
    const [x2, y2] = [end.x - alongX * spacing, end.y - alongY * spacing]
    const [ax, ay] = [upX * ascent * size, upY * ascent * size]
    const [dx, dy] = [-upX * descent * size, -upY * descent * size]
    boxes.push({
      char,
      points: [
        [x1 + dx, y1 + dy],
        [x2 + dx, y2 + dy],
        [x2 + ax, y2 + ay],
        [x1 + ax, y1 + ay],
      ],
    })
  }
  return boxes
}

// How far apart two convex polygons are along the axis that best separates them: at most their
// true distance, so a clearance it finds is real.
function separation(a: readonly Point[], b: readonly Point[]) {
  let best = Number.NEGATIVE_INFINITY
  for (const polygon of [a, b]) {
    for (let index = 0; index < polygon.length; index += 1) {
      const [x1, y1] = polygon[index] ?? [0, 0]
      const [x2, y2] = polygon[(index + 1) % polygon.length] ?? [0, 0]
      const length = Math.hypot(x2 - x1, y2 - y1)
      if (length === 0) continue
      const [nx, ny] = [-(y2 - y1) / length, (x2 - x1) / length]
      const project = (points: readonly Point[]) => points.map(([x, y]) => x * nx + y * ny)
      const [pa, pb] = [project(a), project(b)]
      best = Math.max(best, Math.min(...pb) - Math.max(...pa), Math.min(...pa) - Math.max(...pb))
    }
  }
  return best
}

// How far a point lies from a convex polygon, 0 inside it.
function distanceTo(polygon: readonly Point[], [x, y]: Point) {
  const sides = polygon.map((_, index) => edgeSide(polygon, index, [x, y]))
  if (sides.every((side) => side >= 0) || sides.every((side) => side <= 0)) return 0
  let nearest = Number.POSITIVE_INFINITY
  for (let index = 0; index < polygon.length; index += 1) {
    const [x1, y1] = polygon[index] ?? [0, 0]
    const [x2, y2] = polygon[(index + 1) % polygon.length] ?? [0, 0]
    const [ex, ey] = [x2 - x1, y2 - y1]
    const t = Math.max(0, Math.min(1, ((x - x1) * ex + (y - y1) * ey) / (ex * ex + ey * ey || 1)))
    nearest = Math.min(nearest, Math.hypot(x - (x1 + ex * t), y - (y1 + ey * t)))
  }
  return nearest
}

function edgeSide(polygon: readonly Point[], index: number, [x, y]: Point) {
  const [x1, y1] = polygon[index] ?? [0, 0]
  const [x2, y2] = polygon[(index + 1) % polygon.length] ?? [0, 0]
  return (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
}

function bounds(points: readonly Point[]) {
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as const
}

// Checks every postmark under `root`, marks those whose lettering clashes with `data-clash`, and
// returns how many it checked, how many clashed, and each distinct clash once.
export function checkClearance(root: ParentNode) {
  const postmarks = [...root.querySelectorAll<SVGSVGElement>('svg[data-postmark]')]
  const messages = new Set<string>()
  let clashed = 0
  for (const postmark of postmarks) {
    let clashes = false
    const place = postmark.dataset.postmark ?? 'A postmark'
    const report = (message: string) => {
      messages.add(`${place}: ${message}`)
      clashes = true
    }
    // Ornaments are small and round: each one's circle.
    const keepouts = [...postmark.querySelectorAll<SVGElement>('[data-keepout]')]
      .filter((element) => !element.closest('mask'))
      .map((element) => parseShape(element.dataset.keepout ?? ''))
      .filter((shape) => shape?.kind === 'ellipse')
    const lines: { words: string; boxes: { char: string; points: Point[] }[] }[] = []
    for (const text of postmark.querySelectorAll<SVGTextElement>('text[data-within]')) {
      const within = parseShape(text.dataset.within ?? '')
      const outside = (text.dataset.outside ?? '')
        .split(';')
        .filter((spec) => spec.trim())
        .map(parseShape)
      const words = (text.textContent ?? '').trim()
      const boxes = glyphBoxes(text)
      lines.push({ words, boxes })
      for (const { char, points } of boxes) {
        const deepest = Math.min(...points.map((point) => (within ? depth(within, point) : 0)))
        const intrusion = Math.max(
          ...outside.map((shape) =>
            shape ? Math.max(...points.map((point) => depth(shape, point))) : -margin,
          ),
          Number.NEGATIVE_INFINITY,
        )
        const ornament = keepouts.some(
          (shape) =>
            shape?.kind === 'ellipse' &&
            distanceTo(points, [shape.cx, shape.cy]) < shape.rx + margin,
        )
        if (deepest < margin || intrusion > -margin || ornament) {
          const by =
            deepest < margin
              ? `${(margin - deepest).toFixed(1)} past its edge`
              : ornament
                ? 'into an ornament'
                : 'into a ring or outline'
          report(`“${char}” in “${words}” runs ${by}`)
          break
        }
      }
    }
    // Lines against each other, where their boxes come near.
    for (let first = 0; first < lines.length; first += 1) {
      for (let second = first + 1; second < lines.length; second += 1) {
        const [a, b] = [lines[first], lines[second]]
        if (!a || !b || a.boxes.length === 0 || b.boxes.length === 0) continue
        const [ax0, ay0, ax1, ay1] = bounds(a.boxes.flatMap((box) => box.points))
        const [bx0, by0, bx1, by1] = bounds(b.boxes.flatMap((box) => box.points))
        if (bx0 > ax1 + margin || ax0 > bx1 + margin || by0 > ay1 + margin || ay0 > by1 + margin)
          continue
        const touching = a.boxes.find((box) =>
          b.boxes.some((other) => separation(box.points, other.points) < margin),
        )
        if (touching) report(`“${touching.char}” in “${a.words}” runs into “${b.words}”`)
      }
    }
    postmark.toggleAttribute('data-clash', clashes)
    if (clashes) clashed += 1
  }
  return { checked: postmarks.length, clashed, messages: [...messages] }
}
