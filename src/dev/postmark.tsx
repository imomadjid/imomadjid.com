import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

// A passport-style postmark for a visitor's place. The design (shape, ink, rings, layout, how the
// outline is drawn) comes from the place, so every visitor from Depok gets Depok's stamp; the
// print (date, angle, serial, how the ink took) comes from the visitor, so no two are alike.

export type PostmarkPlace = {
  key: string
  name: string
  region: string
  country: string
  // The place's outline as an SVG path in a 100 x 100 box.
  outline: string
}

type Shape = 'circle' | 'double-circle' | 'octagon' | 'hexagon' | 'oval' | 'rect' | 'notched'
type OutlineStyle = 'fill' | 'stroke' | 'hatch'
type Layout = 'band' | 'stack'

const shapes: readonly Shape[] = [
  'circle',
  'double-circle',
  'octagon',
  'hexagon',
  'oval',
  'rect',
  'notched',
]
const outlineStyles: readonly OutlineStyle[] = ['fill', 'stroke', 'hatch']
const layouts: readonly Layout[] = ['band', 'stack']
const labels = ['Arrived', 'Visited', 'Entry', 'Received', 'Passed']

// Rubber-stamp inks, each with a lighter twin for the dark theme.
const inks = [
  { name: 'red', light: '#b8322a', dark: '#ff7a6e' },
  { name: 'blue', light: '#23489a', dark: '#8fb0ff' },
  { name: 'violet', light: '#5b3a8c', dark: '#c4a5ff' },
  { name: 'green', light: '#1d6a4b', dark: '#6fd6a6' },
  { name: 'black', light: '#262626', dark: '#e6e6e6' },
  { name: 'rust', light: '#a4541b', dark: '#f0a464' },
] as const

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function hash(text: string) {
  let value = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

// mulberry32: a small seeded generator, so designs survive reloads and server rendering.
function generator(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(next: () => number, list: readonly T[]): T {
  const item = list[Math.floor(next() * list.length)] ?? list[0]
  if (item === undefined) throw new Error('pick needs a non-empty list')
  return item
}

export function postmarkDesign(placeKey: string, salt: number) {
  const next = generator(hash(`${placeKey}:${salt}`))
  return {
    shape: pick(next, shapes),
    ink: pick(next, inks),
    outlineStyle: pick(next, outlineStyles),
    layout: pick(next, layouts),
    label: pick(next, labels),
    innerRing: next() < 0.6,
    ticks: next() < 0.45,
    stars: next() < 0.5,
  }
}

function visitorPrint(placeKey: string, visitor: number) {
  const next = generator(hash(`${placeKey}#${visitor}`))
  const day = new Date(Date.UTC(2026, 0, 1) + Math.floor(next() * 365) * 86_400_000)
  return {
    date: `${String(day.getUTCDate()).padStart(2, '0')} ${months[day.getUTCMonth()]} ${day.getUTCFullYear()}`,
    serial: String(1 + Math.floor(next() * 9999)).padStart(4, '0'),
    rotation: (next() - 0.5) * 26,
    inkSeed: Math.floor(next() * 1000),
    pressure: 0.78 + next() * 0.2,
  }
}

// Allo's capitals, measured in Chromium at weights 600 to 800: caps stand 0.73 em tall, letters
// average 0.67 em wide (M and W about 1 em), tabular figures 0.57 em, a space 0.19 em.
const capHeight = 0.73
// The room left between lettering and any rule, ring or border, in viewBox units.
const gap = 4

function textUnits(text: string, spacing: number) {
  let units = 0
  for (const char of text) {
    if (char === ' ') units += 0.2
    else if (char >= '0' && char <= '9') units += 0.57
    else if (char === 'M' || char === 'W') units += 1
    else if (char === '·' || char === '.') units += 0.3
    else units += 0.68
    units += spacing
  }
  return units
}

// A font size that sets `text` within `length` units, at most `max`.
function fit(text: string, length: number, max: number, spacing: number) {
  return Math.min(max, length / textUnits(text, spacing))
}

// Clearance specs that postmark-clearance.ts checks the rendered lettering against: `e cx cy rx
// ry` is an ellipse, `r x y w h` a box, `p x y x y ...` a convex polygon.
function ellipseSpec(cx: number, cy: number, rx: number, ry = rx) {
  return `e ${cx} ${cy} ${rx.toFixed(2)} ${ry.toFixed(2)}`
}

function boxSpec(x: number, y: number, w: number, h: number) {
  return `r ${x} ${y} ${w} ${h}`
}

function polygonPoints(cx: number, cy: number, radius: number, sides: number, turn: number) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = turn + (index / sides) * Math.PI * 2
    return `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`
  })
}

type Design = ReturnType<typeof postmarkDesign>

export function Postmark({
  place,
  visitor,
  salt = 0,
  size = 180,
  className,
  style,
}: {
  place: PostmarkPlace
  visitor: number
  salt?: number
  size?: number
  className?: string
  style?: CSSProperties
}) {
  const id = useId().replaceAll(':', '')
  const design = postmarkDesign(place.key, salt)
  const print = visitorPrint(place.key, visitor)
  const round = design.shape !== 'rect' && design.shape !== 'notched' && design.shape !== 'oval'
  const [width, height] = round ? [220, 220] : design.shape === 'oval' ? [250, 180] : [260, 170]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      data-postmark={`${place.name} (${design.shape})`}
      className={`overflow-visible text-[var(--ink)] data-clash:outline-2 data-clash:outline-offset-4 data-clash:outline-red-500 data-clash:outline-dashed dark:text-[var(--ink-dark)] ${className ?? ''}`}
      style={
        // SAFETY: CSSProperties has no index signature for custom properties; --ink and
        // --ink-dark are plain colour strings.
        {
          '--ink': design.ink.light,
          '--ink-dark': design.ink.dark,
          rotate: `${print.rotation.toFixed(1)}deg`,
          ...style,
        } as CSSProperties
      }
    >
      <title>{`Postmark: ${place.name}, ${place.country}, ${print.date}`}</title>
      <defs>
        {/* Rubber on paper: fine speckle where the ink didn't take, uneven pressure across the
            stamp, and a slight wobble at the edges. */}
        <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={print.inkSeed}
            result="speckle"
          />
          <feColorMatrix
            in="speckle"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 4.6"
            result="speckleMask"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011"
            numOctaves={2}
            seed={print.inkSeed + 7}
            result="pressure"
          />
          <feColorMatrix
            in="pressure"
            type="matrix"
            values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 ${(print.pressure + 0.75).toFixed(2)}`}
            result="pressureMask"
          />
          <feComposite in="SourceGraphic" in2="speckleMask" operator="in" result="speckled" />
          <feComposite in="speckled" in2="pressureMask" operator="in" result="pressed" />
          <feTurbulence
            type="turbulence"
            baseFrequency="0.05"
            numOctaves={1}
            seed={print.inkSeed + 13}
            result="wobble"
          />
          <feDisplacementMap
            in="pressed"
            in2="wobble"
            scale={2}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <pattern
          id={`${id}-hatch`}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="2.2" />
        </pattern>
      </defs>
      <g
        filter={`url(#${id}-ink)`}
        fill="currentColor"
        stroke="currentColor"
        fontFamily="var(--font-sans)"
      >
        {round ? (
          <RoundLayout id={id} place={place} design={design} print={print} />
        ) : design.shape === 'oval' ? (
          <OvalLayout id={id} place={place} design={design} print={print} />
        ) : (
          <RectLayout
            id={id}
            place={place}
            design={design}
            print={print}
            width={width}
            height={height}
          />
        )}
      </g>
    </svg>
  )
}

type LayoutProps = {
  id: string
  place: PostmarkPlace
  design: Design
  print: ReturnType<typeof visitorPrint>
}

function Outline({
  id,
  place,
  design,
  x,
  y,
  box,
}: {
  id: string
  place: PostmarkPlace
  design: Design
  x: number
  y: number
  box: number
}) {
  const scale = box / 100
  const stroke = 2.4 / scale
  const fill =
    design.outlineStyle === 'fill'
      ? 'currentColor'
      : design.outlineStyle === 'hatch'
        ? `url(#${id}-hatch)`
        : 'none'
  return (
    <path
      d={place.outline}
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill={fill}
      stroke="currentColor"
      strokeWidth={design.outlineStyle === 'fill' ? 0 : stroke}
      strokeLinejoin="round"
    />
  )
}

function Star({ x, y, r }: { x: number; y: number; r: number }) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? r : r * 0.45
    const angle = -Math.PI / 2 + (index * Math.PI) / 5
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`
  })
  return <polygon points={points.join(' ')} stroke="none" />
}

function Ticks({
  cx,
  cy,
  radius,
  count,
}: {
  cx: number
  cy: number
  radius: number
  count: number
}) {
  return (
    <g strokeWidth={1.4}>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2
        const [cos, sin] = [Math.cos(angle), Math.sin(angle)]
        return (
          <line
            key={index}
            x1={cx + cos * radius}
            y1={cy + sin * radius}
            x2={cx + cos * (radius - 4)}
            y2={cy + sin * (radius - 4)}
          />
        )
      })}
    </g>
  )
}

function Text({
  x,
  y,
  size,
  weight = 700,
  spacing = 0.06,
  within,
  outside,
  children,
}: {
  x: number
  y: number
  size: number
  weight?: number
  spacing?: number
  within: string
  outside?: string
  children: ReactNode
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      letterSpacing={`${spacing}em`}
      textAnchor="middle"
      stroke="none"
      data-within={within}
      data-outside={outside}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {children}
    </text>
  )
}

function ArcText({
  path,
  size,
  weight,
  spacing,
  within,
  outside,
  children,
}: {
  path: string
  size: number
  weight: number
  spacing: number
  within: string
  outside: string
  children: string
}) {
  return (
    <text
      fontSize={size.toFixed(2)}
      fontWeight={weight}
      letterSpacing={`${spacing}em`}
      stroke="none"
      textAnchor="middle"
      data-within={within}
      data-outside={outside}
    >
      <textPath href={`#${path}`} startOffset="50%">
        {children}
      </textPath>
    </text>
  )
}

// The border of a round postmark, and its inner edge as a clearance spec. A polygon's inner edge
// is the same polygon pulled in by half the stroke along each edge's normal.
function roundBorder(shape: Shape, cx: number, cy: number) {
  const half = 1.5
  const polygon = (radius: number, sides: number, turn: number) => {
    const inset = half / Math.cos(Math.PI / sides)
    return {
      path: `M${polygonPoints(cx, cy, radius, sides, turn).join('L')}Z`,
      inner: `p ${polygonPoints(cx, cy, radius - inset, sides, turn).join(' ')}`,
      // The nearest the border comes to the middle.
      reach: (radius - inset) * Math.cos(Math.PI / sides),
    }
  }
  if (shape === 'octagon') return polygon(104, 8, Math.PI / 8)
  if (shape === 'hexagon') return polygon(106, 6, 0)
  const reach = shape === 'double-circle' ? 93 - 0.7 : 100 - half
  return { path: undefined, inner: ellipseSpec(cx, cy, reach), reach }
}

function RoundLayout({ id, place, design, print }: LayoutProps) {
  const [cx, cy] = [110, 110]
  const border = roundBorder(design.shape, cx, cy)
  const name = place.name.toUpperCase()
  const bottom = (place.country === place.name ? place.region : place.country).toUpperCase()
  // What the lettering must stay outside: the inner ring, its ticks, or the content they frame.
  const ring = design.innerRing ? 64.8 : design.ticks ? 66.7 : 62
  // How much of each arc the lettering may cover, leaving the sides for the stars.
  const span = (design.stars ? 0.74 : 0.86) * Math.PI

  // The name sits as far out as it can, its caps a gap inside the border, so it reads as the
  // stamp's rim; the bottom line hangs its caps inward from a baseline a gap inside the border.
  const nameSize = Math.min(
    22,
    (border.reach - ring - gap * 2) / capHeight,
    (span * (ring + gap)) / textUnits(name, 0.08),
  )
  const topRadius = border.reach - gap - capHeight * nameSize
  const bottomRadius = border.reach - gap
  const bottomSize = Math.min(
    13,
    (bottomRadius - ring - gap) / capHeight,
    (span * (bottomRadius - capHeight * 13)) / textUnits(bottom, 0.16),
  )
  const ringSpec = ellipseSpec(cx, cy, ring + 0.5)
  const insideRing = ellipseSpec(cx, cy, design.innerRing ? 63.2 : 60)

  return (
    <>
      {border.path ? (
        <path d={border.path} fill="none" strokeWidth={3} strokeLinejoin="round" />
      ) : (
        <circle cx={cx} cy={cy} r={100} fill="none" strokeWidth={3} />
      )}
      {design.shape === 'double-circle' && (
        <circle cx={cx} cy={cy} r={93} fill="none" strokeWidth={1.4} />
      )}
      {design.innerRing && <circle cx={cx} cy={cy} r={64} fill="none" strokeWidth={1.6} />}
      {design.ticks && <Ticks cx={cx} cy={cy} radius={design.innerRing ? 64 : 66} count={48} />}

      <path
        id={`${id}-top`}
        d={`M${cx - topRadius},${cy} A${topRadius},${topRadius} 0 0 1 ${cx + topRadius},${cy}`}
        fill="none"
        stroke="none"
      />
      <path
        id={`${id}-bottom`}
        d={`M${cx - bottomRadius},${cy} A${bottomRadius},${bottomRadius} 0 0 0 ${cx + bottomRadius},${cy}`}
        fill="none"
        stroke="none"
      />
      <ArcText
        path={`${id}-top`}
        size={nameSize}
        weight={800}
        spacing={0.08}
        within={border.inner}
        outside={ringSpec}
      >
        {name}
      </ArcText>
      <ArcText
        path={`${id}-bottom`}
        size={bottomSize}
        weight={600}
        spacing={0.16}
        within={border.inner}
        outside={ringSpec}
      >
        {bottom}
      </ArcText>
      {design.stars && (
        <>
          <Star x={cx - 82} y={cy + 4} r={5.5} />
          <Star x={cx + 82} y={cy + 4} r={5.5} />
        </>
      )}

      {design.layout === 'band' ? (
        <>
          <Outline id={id} place={place} design={design} x={cx - 19} y={cy - 54} box={38} />
          <line x1={cx - 58} x2={cx + 58} y1={cy - 10} y2={cy - 10} strokeWidth={1.6} />
          <line x1={cx - 58} x2={cx + 58} y1={cy + 14} y2={cy + 14} strokeWidth={1.6} />
          <Text x={cx} y={cy + 8.5} size={15} weight={800} within={insideRing}>
            {print.date}
          </Text>
          <Text x={cx} y={cy + 27} size={7} weight={600} spacing={0.18} within={insideRing}>
            {design.label.toUpperCase()} · NO.{print.serial}
          </Text>
        </>
      ) : (
        <>
          <Outline id={id} place={place} design={design} x={cx - 28} y={cy - 48} box={56} />
          <Text
            x={cx}
            y={cy + 26}
            size={13}
            weight={800}
            within={insideRing}
            outside={boxSpec(cx - 28, cy - 48, 56, 56)}
          >
            {print.date}
          </Text>
          <Text x={cx} y={cy + 42} size={8} weight={600} spacing={0.2} within={insideRing}>
            {design.label.toUpperCase()}
          </Text>
        </>
      )}
    </>
  )
}

function OvalLayout({ id, place, design, print }: LayoutProps) {
  const [cx, cy, rx, ry] = [125, 90, 118, 82]
  const name = place.name.toUpperCase()
  const bottom = place.country.toUpperCase()
  // The border's inner edge, and the inner ring's outer edge (or where the content ends).
  const [ix, iy] = [rx - 1.5, ry - 1.5]
  const [kx, ky] = design.innerRing ? [rx - 29.3, ry - 29.3] : [rx - 30, ry - 30]
  // Roughly half the ellipse's perimeter at the lettering, three quarters of it usable.
  const room = 0.75 * Math.PI * Math.sqrt(((ix - 10) ** 2 + (iy - 10) ** 2) / 2)
  const nameSize = Math.min(20, (iy - ky - gap * 2) / capHeight, room / textUnits(name, 0.08))
  const [tx, ty] = [ix - gap - capHeight * nameSize, iy - gap - capHeight * nameSize]
  const [bx, by] = [ix - gap, iy - gap]
  const bottomSize = Math.min(12, (by - ky - gap) / capHeight, room / textUnits(bottom, 0.16))
  const within = ellipseSpec(cx, cy, ix, iy)
  const ringSpec = ellipseSpec(cx, cy, kx + 0.5, ky + 0.5)
  const insideRing = ellipseSpec(cx, cy, kx - 1.5, ky - 1.5)
  const outline = boxSpec(cx - 80, cy - 18, 36, 36)
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" strokeWidth={3} />
      {design.innerRing && (
        <ellipse cx={cx} cy={cy} rx={rx - 30} ry={ry - 30} fill="none" strokeWidth={1.4} />
      )}
      <path
        id={`${id}-top`}
        d={`M${cx - tx},${cy} A${tx},${ty} 0 0 1 ${cx + tx},${cy}`}
        fill="none"
        stroke="none"
      />
      <path
        id={`${id}-bottom`}
        d={`M${cx - bx},${cy} A${bx},${by} 0 0 0 ${cx + bx},${cy}`}
        fill="none"
        stroke="none"
      />
      <ArcText
        path={`${id}-top`}
        size={nameSize}
        weight={800}
        spacing={0.08}
        within={within}
        outside={ringSpec}
      >
        {name}
      </ArcText>
      <ArcText
        path={`${id}-bottom`}
        size={bottomSize}
        weight={600}
        spacing={0.16}
        within={within}
        outside={ringSpec}
      >
        {bottom}
      </ArcText>
      <Outline id={id} place={place} design={design} x={cx - 80} y={cy - 18} box={36} />
      <Text x={cx + 20} y={cy + 4} size={13} weight={800} within={insideRing} outside={outline}>
        {print.date}
      </Text>
      <Text
        x={cx + 20}
        y={cy + 17}
        size={7}
        weight={600}
        spacing={0.2}
        within={insideRing}
        outside={outline}
      >
        {design.label.toUpperCase()} · NO.{print.serial}
      </Text>
    </>
  )
}

function RectLayout({
  id,
  place,
  design,
  print,
  width,
  height,
}: LayoutProps & { width: number; height: number }) {
  const inset = 6
  const notch = 16
  const notched = design.shape === 'notched'
  // A notched frame `offset` in from the stamp's edge; its 45° corners pull in with it, so they
  // stay parallel to the outer frame's.
  const notchedPoints = (offset: number) => {
    const cut = notch - (offset - inset) * (2 - Math.SQRT2)
    const [x0, y0, x1, y1] = [offset, offset, width - offset, height - offset]
    return [
      [x0 + cut, y0],
      [x1 - cut, y0],
      [x1, y0 + cut],
      [x1, y1 - cut],
      [x1 - cut, y1],
      [x0 + cut, y1],
      [x0, y1 - cut],
      [x0, y0 + cut],
    ].map(([x, y]) => `${(x ?? 0).toFixed(2)} ${(y ?? 0).toFixed(2)}`)
  }
  const notchedPath = (offset: number) => `M${notchedPoints(offset).join('L')}Z`
  // The innermost frame edge: the inner rule's, or the border's.
  const edge = design.innerRing ? inset + 7.6 : inset + 1.5
  const within = notched
    ? `p ${notchedPoints(edge).join(' ')}`
    : boxSpec(edge, edge, width - edge * 2, height - edge * 2)
  const name = place.name.toUpperCase()
  // The column right of the outline.
  const outline = { x: 30, y: 68, box: 72 }
  const left = outline.x + outline.box + gap * 2
  const right = width - edge - gap
  const column = { x: (left + right) / 2, room: right - left }
  const avoid = boxSpec(outline.x, outline.y, outline.box, outline.box)
  const line = (text: string, max: number, spacing: number) => fit(text, column.room, max, spacing)
  const region = place.region.toUpperCase()
  const country = place.country.toUpperCase()
  const label = `${design.label.toUpperCase()} · NO.${print.serial}`
  return (
    <>
      {notched ? (
        <path d={notchedPath(inset)} fill="none" strokeWidth={3} strokeLinejoin="round" />
      ) : (
        <rect
          x={inset}
          y={inset}
          width={width - inset * 2}
          height={height - inset * 2}
          rx={10}
          fill="none"
          strokeWidth={3}
        />
      )}
      {design.innerRing && notched && (
        <path d={notchedPath(inset + 7)} fill="none" strokeWidth={1.2} strokeLinejoin="round" />
      )}
      {design.innerRing && !notched && (
        <rect
          x={inset + 7}
          y={inset + 7}
          width={width - (inset + 7) * 2}
          height={height - (inset + 7) * 2}
          rx={5}
          fill="none"
          strokeWidth={1.2}
        />
      )}
      <Text
        x={width / 2}
        y={46}
        size={fit(name, width - 60, 26, 0.08)}
        weight={800}
        spacing={0.08}
        within={within}
      >
        {name}
      </Text>
      <line
        x1={28}
        x2={width - 28}
        y1={58}
        y2={58}
        strokeWidth={1.4}
        strokeDasharray={design.ticks ? '3 3' : undefined}
      />
      <Outline id={id} place={place} design={design} {...outline} />
      <Text
        x={column.x}
        y={96}
        size={line(print.date, 18, 0.06)}
        weight={800}
        within={within}
        outside={avoid}
      >
        {print.date}
      </Text>
      <Text
        x={column.x}
        y={114}
        size={line(region, 10, 0.14)}
        weight={600}
        spacing={0.14}
        within={within}
        outside={avoid}
      >
        {region}
      </Text>
      <Text
        x={column.x}
        y={128}
        size={line(country, 10, 0.14)}
        weight={600}
        spacing={0.14}
        within={within}
        outside={avoid}
      >
        {country}
      </Text>
      <Text
        x={column.x}
        y={150}
        size={line(label, 8, 0.22)}
        weight={600}
        spacing={0.22}
        within={within}
        outside={avoid}
      >
        {label}
      </Text>
    </>
  )
}
