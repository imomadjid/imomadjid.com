// Minimal SVG reader for 18px icons: elements with inherited tone, transforms and sampled bounds.
// No dependencies, so the scripts run anywhere Node 20+ runs.

const SHAPES = new Set(['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon'])
const IDENTITY = [1, 0, 0, 1, 0, 0]

export function parseAttrs(source) {
  const attrs = {}
  for (const [, name, double, single] of source.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[name] = double ?? single
  }
  return attrs
}

function multiply(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

export function parseTransform(value = '') {
  let matrix = IDENTITY
  for (const [, fn, args] of value.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number)
    let m = IDENTITY
    if (fn === 'translate') m = [1, 0, 0, 1, n[0], n[1] ?? 0]
    else if (fn === 'scale') m = [n[0], 0, 0, n[1] ?? n[0], 0, 0]
    else if (fn === 'matrix') m = n
    else if (fn === 'rotate') {
      const r = (n[0] * Math.PI) / 180
      const [cx, cy] = [n[1] ?? 0, n[2] ?? 0]
      const c = Math.cos(r)
      const s = Math.sin(r)
      m = [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]
    }
    matrix = multiply(matrix, m)
  }
  return matrix
}

const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]

function arcPoints(x1, y1, rx, ry, phiDeg, large, sweep, x2, y2) {
  // Endpoint to center conversion from the SVG spec, then sampled along the arc.
  if (rx === 0 || ry === 0) return [[x2, y2]]
  const phi = (phiDeg * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cos * dx + sin * dy
  const y1p = -sin * dx + cos * dy
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  let k = Math.sqrt(Math.max(0, num / den))
  if (large === sweep) k = -k
  const cxp = (k * rx * y1p) / ry
  const cyp = (-k * ry * x1p) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const angle = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    return a
  }
  const t1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let dt = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sweep && dt > 0) dt -= 2 * Math.PI
  if (sweep && dt < 0) dt += 2 * Math.PI
  const points = []
  for (let i = 1; i <= 48; i++) {
    const t = t1 + (dt * i) / 48
    const px = rx * Math.cos(t)
    const py = ry * Math.sin(t)
    points.push([cos * px - sin * py + cx, sin * px + cos * py + cy])
  }
  return points
}

function bezier(points, steps = 16) {
  const out = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    let layer = points
    while (layer.length > 1) {
      layer = layer.slice(1).map((p, j) => [
        layer[j][0] + (p[0] - layer[j][0]) * t,
        layer[j][1] + (p[1] - layer[j][1]) * t,
      ])
    }
    out.push(layer[0])
  }
  return out
}

export function pathPoints(d) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) ?? []
  const points = []
  let i = 0
  let cmd = ''
  let cur = [0, 0]
  let start = [0, 0]
  let lastCtrl = null
  let decimals = 0
  const num = () => {
    const t = tokens[i++]
    const frac = t.split('.')[1]
    if (frac) decimals = Math.max(decimals, frac.replace(/e.*/i, '').length)
    return Number(t)
  }
  // Arc flags may be written without separators, as in "a.75.75 0 01.75.75".
  const flag = () => {
    const t = tokens[i]
    if (t.length > 1 && /^[01]/.test(t)) {
      tokens[i] = t.slice(1)
      return Number(t[0])
    }
    i++
    return Number(t)
  }
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++]
    const rel = cmd === cmd.toLowerCase()
    const base = rel ? cur : [0, 0]
    const pt = () => {
      const x = num()
      const y = num()
      return [base[0] + x, base[1] + y]
    }
    switch (cmd.toUpperCase()) {
      case 'M':
        cur = pt()
        start = cur
        points.push(cur)
        cmd = rel ? 'l' : 'L'
        lastCtrl = null
        break
      case 'L':
        cur = pt()
        points.push(cur)
        lastCtrl = null
        break
      case 'H':
        cur = [(rel ? cur[0] : 0) + num(), cur[1]]
        points.push(cur)
        lastCtrl = null
        break
      case 'V':
        cur = [cur[0], (rel ? cur[1] : 0) + num()]
        points.push(cur)
        lastCtrl = null
        break
      case 'C': {
        const c1 = pt()
        const c2 = pt()
        const end = pt()
        points.push(...bezier([cur, c1, c2, end]))
        lastCtrl = c2
        cur = end
        break
      }
      case 'S': {
        const c1 = lastCtrl ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]] : cur
        const c2 = pt()
        const end = pt()
        points.push(...bezier([cur, c1, c2, end]))
        lastCtrl = c2
        cur = end
        break
      }
      case 'Q': {
        const c = pt()
        const end = pt()
        points.push(...bezier([cur, c, end]))
        lastCtrl = c
        cur = end
        break
      }
      case 'T': {
        const c = lastCtrl ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]] : cur
        const end = pt()
        points.push(...bezier([cur, c, end]))
        lastCtrl = c
        cur = end
        break
      }
      case 'A': {
        const rx = num()
        const ry = num()
        const rot = num()
        const large = flag()
        const sweep = flag()
        const end = pt()
        points.push(...arcPoints(cur[0], cur[1], rx, ry, rot, large, sweep, end[0], end[1]))
        cur = end
        lastCtrl = null
        break
      }
      case 'Z':
        cur = start
        lastCtrl = null
        break
      default:
        i++
    }
  }
  return { points, decimals }
}

function shapePoints(tag, a) {
  const n = (k, fallback = 0) => (a[k] === undefined ? fallback : Number(a[k]))
  if (tag === 'path') return pathPoints(a.d ?? '')
  if (tag === 'circle' || tag === 'ellipse') {
    const rx = tag === 'circle' ? n('r') : n('rx')
    const ry = tag === 'circle' ? n('r') : n('ry')
    const points = []
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * 2 * Math.PI
      points.push([n('cx') + rx * Math.cos(t), n('cy') + ry * Math.sin(t)])
    }
    return { points, decimals: 0 }
  }
  if (tag === 'rect') {
    const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')]
    return { points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], decimals: 0 }
  }
  if (tag === 'line') return { points: [[n('x1'), n('y1')], [n('x2'), n('y2')]], decimals: 0 }
  const nums = (a.points ?? '').split(/[\s,]+/).filter(Boolean).map(Number)
  const points = []
  for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i], nums[i + 1]])
  return { points, decimals: 0 }
}

const isPaint = (v) => v !== undefined && v !== 'none'

/** Reads an icon into its root attributes and a flat list of shapes with inherited style. */
export function readIcon(source) {
  const svg = source.replace(/<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->/g, '')
  const stack = [{ matrix: IDENTITY, style: {}, group: null }]
  const shapes = []
  let root = null
  let groupId = 0
  for (const [, close, tag, rest, selfClose] of svg.matchAll(/<(\/?)([\w:-]+)([^>]*?)(\/?)>/g)) {
    if (close) {
      if (stack.length > 1) stack.pop()
      continue
    }
    const attrs = parseAttrs(rest)
    const parent = stack.at(-1)
    if (tag === 'svg' && !root) root = attrs
    const style = { ...parent.style }
    for (const key of ['fill', 'stroke', 'stroke-width', 'data-color']) {
      if (attrs[key] !== undefined) style[key] = attrs[key]
    }
    // Opacity multiplies down the tree; fill-opacity only inherits.
    const ownOpacity = attrs.opacity === undefined ? 1 : Number(attrs.opacity)
    style.opacity = (parent.style.opacity ?? 1) * ownOpacity
    if (attrs['fill-opacity'] !== undefined) style['fill-opacity'] = Number(attrs['fill-opacity'])
    const matrix = multiply(parent.matrix, parseTransform(attrs.transform))
    let group = parent.group
    if (tag === 'g' && ownOpacity < 1) group = ++groupId
    if (SHAPES.has(tag)) {
      const { points, decimals } = shapePoints(tag, attrs)
      const fill = style.fill ?? root?.fill ?? 'black'
      const stroke = style.stroke ?? root?.stroke
      const strokeWidth = isPaint(stroke) ? Number(style['stroke-width'] ?? root?.['stroke-width'] ?? 1) : 0
      const tone = (isPaint(fill) ? (style['fill-opacity'] ?? 1) : 1) * style.opacity
      const placed = points.map((p) => apply(matrix, p))
      const half = strokeWidth / 2
      const xs = placed.map((p) => p[0])
      const ys = placed.map((p) => p[1])
      shapes.push({
        tag,
        attrs,
        fill,
        stroke,
        strokeWidth,
        tone,
        group,
        decimals,
        rawStyle: attrs.style,
        box: xs.length
          ? [Math.min(...xs) - half, Math.min(...ys) - half, Math.max(...xs) + half, Math.max(...ys) + half]
          : null,
      })
    }
    if (!selfClose && tag !== 'svg') stack.push({ matrix, style, group })
    else if (!selfClose && tag === 'svg') stack.push({ matrix, style: { ...style, opacity: 1 }, group })
  }
  return { root, shapes }
}
