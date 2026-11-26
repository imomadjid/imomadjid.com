import type { ReactNode } from 'react'

import metrics from './postmark-metrics.json'
import { pictorials, pictorialStroke } from './postmark-pictorials'

// What every postmark layout shares: the place, its seeded design and the visitor's print, the
// lettering fit (from Allo's measured metrics), the clearance specs that postmark-clearance.ts
// checks the rendered glyphs against, and the picture slot (the place's pictorial, or its map
// outline where it has none).

export type PostmarkPlace = {
  key: string
  name: string
  region: string
  country: string
  // ISO 3166-1 alpha-2, as Cloudflare gives it.
  countryCode: string
  // The place's outline as an SVG path in a 100 x 100 box.
  outline: string
}

// Layout families, after the postmark design research: the prototype's own round, oval and
// rectangular stamps, then real postmark forms. Names are the design report's.
export const families = [
  'classic',
  'fukeiin',
  'eki',
  'sonderstempel',
  'bridge',
  'duplex',
  'wavy',
  'slogan',
  'first-day',
  'passport',
  'shield',
  'long-hexagon',
  'seal',
  'mute',
] as const
export type Family = (typeof families)[number]

export const familyNames = {
  classic: 'Classic',
  fukeiin: 'Scenic circle (fūkeiin)',
  eki: 'Station panel (eki stamp)',
  sonderstempel: 'Special handstamp (Sonderstempel)',
  bridge: 'Bridge date stamp',
  duplex: 'Duplex with killer bars',
  wavy: 'Wavy-line machine cancel',
  slogan: 'Slogan box',
  'first-day': 'First-day cancel',
  passport: 'Passport entry stamp',
  shield: 'Shield',
  'long-hexagon': 'Long hexagon',
  seal: 'Reversed seal',
  mute: 'Mute pictorial',
} as const satisfies Record<Family, string>

export type Shape = 'circle' | 'double-circle' | 'octagon' | 'hexagon' | 'oval' | 'rect' | 'notched'
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

// Rubber-stamp inks, each with a lighter twin for the dark theme. Tobiiro is the reddish brown of
// Japan's scenic postmarks.
const inks = [
  { name: 'red', light: '#b8322a', dark: '#ff7a6e' },
  { name: 'blue', light: '#23489a', dark: '#8fb0ff' },
  { name: 'violet', light: '#5b3a8c', dark: '#c4a5ff' },
  { name: 'green', light: '#1d6a4b', dark: '#6fd6a6' },
  { name: 'black', light: '#262626', dark: '#e6e6e6' },
  { name: 'rust', light: '#a4541b', dark: '#f0a464' },
  { name: 'tobiiro', light: '#8a3324', dark: '#e58a72' },
] as const
export type InkName = (typeof inks)[number]['name']
const inkNames = inks.map((ink) => ink.name)

export function inkOf(name: InkName) {
  return inks.find((ink) => ink.name === name) ?? inks[0]
}

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

// A place's design: the same for every visitor from it. Later draws come after earlier ones, so
// adding one keeps the designs already seen.
export function postmarkDesign(placeKey: string, salt: number) {
  const next = generator(hash(`${placeKey}:${salt}`))
  return {
    shape: pick(next, shapes),
    outlineStyle: pick(next, outlineStyles),
    layout: pick(next, layouts),
    label: pick(next, labels),
    innerRing: next() < 0.6,
    ticks: next() < 0.45,
    family: pick(next, families),
    // A family's own alternative: a ground chord, a solid banner, a square seal, a frame.
    variant: next() < 0.5,
    // Where a wavy cancel's picture falls along its lines, 0 to 1.
    along: next(),
  }
}

export type Design = ReturnType<typeof postmarkDesign>

// The style a place's stamp is assembled from at run time, chosen apart from its structure (the
// family): its ink, how heavy and how widely spaced its lettering is, how it sets the date, its
// ornaments and, for round frames, its border. Each family lists what it accepts
// (familyAccepts); the layouts size every line from the choice, so any accepted combination
// clears its borders.
const letterWeights = {
  regular: { heavy: 700, mid: 600, light: 500 },
  bold: { heavy: 800, mid: 700, light: 600 },
  black: { heavy: 900, mid: 800, light: 700 },
} as const
export type LetterWeight = keyof typeof letterWeights
// A layout's three levels of lettering: the name and date, secondary lines, small print.
export type Tier = keyof (typeof letterWeights)['bold']
// Multiplies each line's own letter-spacing.
const trackings = { tight: 0.5, normal: 1, wide: 1.6 } as const
export type Tracking = keyof typeof trackings
const ornaments = ['stars', 'dots', 'none'] as const
export type Ornament = (typeof ornaments)[number]
const borders = ['single', 'double', 'beaded'] as const
export type Border = (typeof borders)[number]

export type Style = {
  ink: InkName
  weight: LetterWeight
  tracking: Tracking
  date: DateStyle
  ornament: Ornament
  border: Border
}
export type Axis = keyof Style
type Accepts = { [axis in Axis]: readonly Style[axis][] }

const anyWeight: readonly LetterWeight[] = ['bold', 'regular', 'black']
const anyTracking: readonly Tracking[] = ['normal', 'tight', 'wide']

// What each family accepts on every axis, its own choice first. An axis a family doesn't draw
// has the one entry.
const familyAccepts = {
  classic: { date: ['long', 'fullDots', 'us'], ornament: ['stars', 'none'], border: ['single'] },
  fukeiin: {
    date: ['dots', 'fullDots'],
    ornament: ['dots', 'stars', 'none'],
    border: ['single', 'double', 'beaded'],
  },
  eki: { date: ['long'], ornament: ['none'], border: ['single'] },
  sonderstempel: {
    date: ['fullDots', 'dots', 'long'],
    ornament: ['stars', 'dots', 'none'],
    border: ['single'],
  },
  bridge: {
    date: ['long', 'short', 'us'],
    ornament: ['stars', 'dots', 'none'],
    border: ['single', 'double', 'beaded'],
  },
  duplex: { date: ['short', 'dots'], ornament: ['none'], border: ['single', 'double'] },
  wavy: { date: ['short', 'dots'], ornament: ['none'], border: ['single', 'double', 'beaded'] },
  slogan: { date: ['short', 'dots'], ornament: ['none'], border: ['single', 'double', 'beaded'] },
  'first-day': { date: ['us', 'long'], ornament: ['none'], border: ['single'] },
  passport: { date: ['long', 'fullDots'], ornament: ['none'], border: ['single'] },
  shield: { date: ['fullDots', 'dots', 'long'], ornament: ['none'], border: ['single'] },
  'long-hexagon': { date: ['dots', 'fullDots'], ornament: ['none'], border: ['single'] },
  seal: { date: ['dots', 'short'], ornament: ['none'], border: ['single'] },
  mute: { date: ['long'], ornament: ['none'], border: ['single'] },
} as const satisfies Record<Family, Omit<Accepts, 'ink' | 'weight' | 'tracking'>>

// Every value of every axis, for pickers.
export const axisValues: Accepts = {
  ink: inkNames,
  weight: ['regular', 'bold', 'black'],
  tracking: ['tight', 'normal', 'wide'],
  date: ['long', 'short', 'dots', 'fullDots', 'us'],
  ornament: ornaments,
  border: borders,
}

export function accepts(family: Family): Accepts {
  return { ink: inkNames, weight: anyWeight, tracking: anyTracking, ...familyAccepts[family] }
}

// The place's style for `family`, seeded from the place like its design, with any `choices` the
// family accepts in place of the seeded ones.
export function postmarkStyle(
  placeKey: string,
  salt: number,
  family: Family,
  choices: Partial<Style> = {},
): Style {
  const next = generator(hash(`${placeKey}:${salt}:${family}`))
  const list = accepts(family)
  const choose = <A extends Axis>(axis: A): Style[A] => {
    const seeded = pick(next, list[axis])
    const chosen = choices[axis]
    return chosen !== undefined && list[axis].includes(chosen) ? chosen : seeded
  }
  return {
    ink: choose('ink'),
    weight: choose('weight'),
    tracking: choose('tracking'),
    date: choose('date'),
    ornament: choose('ornament'),
    border: choose('border'),
  }
}

// A visitor's print: the same design, struck on their own day at their own angle.
export function visitorPrint(placeKey: string, visitor: number) {
  const next = generator(hash(`${placeKey}#${visitor}`))
  const day = new Date(Date.UTC(2026, 0, 1) + Math.floor(next() * 365) * 86_400_000)
  return {
    day: day.getUTCDate(),
    month: day.getUTCMonth(),
    year: day.getUTCFullYear(),
    serial: String(1 + Math.floor(next() * 9999)).padStart(4, '0'),
    rotation: (next() - 0.5) * 26,
    inkSeed: Math.floor(next() * 1000),
    pressure: 0.78 + next() * 0.2,
    // A passport stamp's corners: square for an arrival, rounded for a departure.
    departure: next() < 0.35,
  }
}

export type Print = ReturnType<typeof visitorPrint>

// Dates as each postal tradition sets them.
export const dates = {
  // 25 NOV 2026: British and passport stamps.
  long: (print: Print) => `${two(print.day)} ${monthName(print)} ${print.year}`,
  // 25 NOV 26: a duplex's narrow bridge.
  short: (print: Print) => `${two(print.day)} ${monthName(print)} ${two(print.year % 100)}`,
  // 25.11.26: Japanese scenic postmarks.
  dots: (print: Print) => `${two(print.day)}.${two(print.month + 1)}.${two(print.year % 100)}`,
  // 25.11.2026: German special handstamps.
  fullDots: (print: Print) => `${two(print.day)}.${two(print.month + 1)}.${print.year}`,
  // NOV 25 2026: American first-day cancels.
  us: (print: Print) => `${monthName(print)} ${two(print.day)} ${print.year}`,
}

function two(value: number) {
  return String(value).padStart(2, '0')
}

export type DateStyle = keyof typeof dates

export function monthName(print: Print) {
  return months[print.month] ?? ''
}

// Everything a layout draws from.
export type Kit = {
  id: string
  place: PostmarkPlace
  design: Design
  print: Print
  style: Style
  // Draw the map outline even where the place has a pictorial.
  outline: boolean
}

// Allo's capitals stand 0.73 em tall (1490 of 2048 units); accents rise to about 0.94 em and
// cedillas drop 0.26 em, which inkHeights accounts for.
export const capHeight = 0.73
// The room left between lettering and any rule, ring or border, in viewBox units.
export const gap = 4

// Advances and ink heights measured from Allo by tools/postmarks/metrics.ts, with tabular
// figures and capital punctuation, as the lettering is set.
const glyphs: {
  opticalSize: number
  weights: number[]
  advances: Record<string, number[]>
  heights: Record<string, number[]>
} = metrics
// A character Allo lacks falls back to another font: allow it an em and full heights.
const unknown = { advance: 1, ascent: 1, descent: 0.3 }

function glyphKey(char: string) {
  if (Object.hasOwn(glyphs.advances, char)) return char
  // An accented letter outside the table measures as its base letter, with an accent's height.
  const base = char.normalize('NFD')[0] ?? ''
  return base !== char && Object.hasOwn(glyphs.advances, base) ? base : undefined
}

function advance(char: string, weight: number) {
  const key = glyphKey(char)
  const row = key === undefined ? undefined : glyphs.advances[key]
  if (!row) return unknown.advance
  const first = glyphs.weights[0] ?? 400
  const step = (glyphs.weights[1] ?? 500) - first
  const at = Math.min(row.length - 1, Math.max(0, (weight - first) / step))
  const index = Math.min(row.length - 2, Math.floor(at))
  const a = row[index] ?? 0
  const b = row[index + 1] ?? a
  return a + (b - a) * (at - index)
}

// How wide `text` sets, in ems, with `spacing` em after every character as browsers add it.
export function textUnits(text: string, spacing: number, weight = 800) {
  let units = 0
  for (const char of text) units += advance(char, weight) + spacing
  return units
}

// How far `text`'s ink rises above and drops below its baseline, in ems.
export function inkHeights(text: string) {
  let [ascent, descent] = [0, 0]
  for (const char of text) {
    if (char.trim() === '') continue
    const key = glyphKey(char)
    const [up, down] =
      key === undefined
        ? [unknown.ascent, unknown.descent]
        : key === char
          ? (glyphs.heights[key] ?? [])
          : // Allo's tallest stacked accents reach about 1.1 em.
            [
              Math.max(
                char.normalize('NFD').length > 2 ? 1.1 : 0.94,
                glyphs.heights[key]?.[0] ?? 0,
              ),
              glyphs.heights[key]?.[1] ?? 0.1,
            ]
    ascent = Math.max(ascent, up ?? unknown.ascent)
    descent = Math.max(descent, down ?? unknown.descent)
  }
  return { ascent, descent }
}

// A line of lettering, ready to spread onto Text or ArcText: its size, weight and spacing from
// the kit's style, and how far its ink rises and drops at that size.
export type Line = {
  size: number
  weight: number
  spacing: number
  ascent: number
  descent: number
}

// Sets `text` at `tier` with the family's own `spacing` (scaled by the style's tracking), as large
// as fits in `length`, at most `max`.
export function line(
  kit: Kit,
  text: string,
  tier: Tier,
  spacing: number,
  length: number,
  max: number,
): Line {
  const weight = letterWeights[kit.style.weight][tier]
  const tracked = spacing * trackings[kit.style.tracking]
  return sized(text, Math.min(max, length / textUnits(text, tracked, weight)), weight, tracked)
}

function sized(text: string, size: number, weight: number, spacing: number): Line {
  const { ascent, descent } = inkHeights(text)
  return { size, weight, spacing, ascent: ascent * size, descent: descent * size }
}

// The baseline that centres a line's caps on `middle`.
export function centred(set: Line, middle: number) {
  return middle + (capHeight * set.size) / 2
}

// The kit's date, as its style sets it.
export function dateOf(kit: Kit) {
  return dates[kit.style.date](kit.print)
}

// Clearance specs: `e cx cy rx ry` is an ellipse, `r x y w h` a box, `p x y x y ...` a convex
// polygon. Several are joined with `;`.
export function ellipseSpec(cx: number, cy: number, rx: number, ry = rx) {
  return `e ${cx} ${cy} ${rx.toFixed(2)} ${ry.toFixed(2)}`
}

export function boxSpec(x: number, y: number, w: number, h: number) {
  return `r ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`
}

export type Point = readonly [number, number]

export function polygonSpec(points: readonly Point[]) {
  return `p ${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')}`
}

export function polygonPoints(cx: number, cy: number, radius: number, sides: number, turn: number) {
  return Array.from({ length: sides }, (_, index): Point => {
    const angle = turn + (index / sides) * Math.PI * 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  })
}

export function pathOf(points: readonly Point[]) {
  return `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`
}

// A convex polygon with every edge moved `distance` inward: a stroked frame's inner edge.
export function insetPolygon(points: readonly Point[], distance: number) {
  const count = points.length
  const cx = points.reduce((sum, [x]) => sum + x, 0) / count
  const cy = points.reduce((sum, [, y]) => sum + y, 0) / count
  const lines = points.map(([x1, y1], index) => {
    const [x2, y2] = points[(index + 1) % count] ?? [x1, y1]
    const length = Math.hypot(x2 - x1, y2 - y1) || 1
    let [nx, ny] = [-(y2 - y1) / length, (x2 - x1) / length]
    // Point the normal at the middle.
    if ((cx - x1) * nx + (cy - y1) * ny < 0) [nx, ny] = [-nx, -ny]
    return { x: x1 + nx * distance, y: y1 + ny * distance, dx: x2 - x1, dy: y2 - y1 }
  })
  return lines.map((line, index): Point => {
    const previous = lines[(index + count - 1) % count] ?? line
    const cross = previous.dx * line.dy - previous.dy * line.dx
    if (Math.abs(cross) < 1e-9) return [line.x, line.y]
    const t = ((line.x - previous.x) * line.dy - (line.y - previous.y) * line.dx) / cross
    return [previous.x + previous.dx * t, previous.y + previous.dy * t]
  })
}

// Lettering on the two arcs of a round frame between its border's inner edge (`reach`) and a ring
// or the content inside (`ring`). The name sits as far out as it can, its ink a gap inside the
// border; the bottom line hangs inward from a baseline a gap inside it, its descenders toward the
// border. `span` is how much of each arc the lettering may cover.
export function rimLettering(
  kit: Kit,
  {
    reach,
    ring,
    name,
    bottom,
    span,
    nameMax = 22,
    bottomMax = 13,
  }: {
    reach: number
    ring: number
    name: string
    bottom: string
    span: number
    nameMax?: number
    bottomMax?: number
  },
) {
  const room = reach - ring - gap * 2
  const top = inkHeights(name)
  const nameSet = line(kit, name, 'heavy', 0.08, span * (ring + gap), nameMax)
  const nameSize = Math.min(nameSet.size, room / (top.ascent + top.descent))
  const under = inkHeights(bottom)
  const bottomSet = line(
    kit,
    bottom,
    'light',
    0.16,
    span * (reach - gap - (under.ascent + under.descent) * bottomMax),
    bottomMax,
  )
  const bottomSize = Math.min(bottomSet.size, room / (under.ascent + under.descent))
  return {
    name: sized(name, nameSize, nameSet.weight, nameSet.spacing),
    bottom: sized(bottom, bottomSize, bottomSet.weight, bottomSet.spacing),
    topRadius: reach - gap - top.ascent * nameSize,
    bottomRadius: reach - gap - under.descent * bottomSize,
  }
}

// The arcs rim lettering runs along: over the top left to right, under the bottom left to right.
export function arcPaths(id: string, cx: number, cy: number, top: number, bottom: number) {
  return (
    <>
      <path
        id={`${id}-top`}
        d={`M${cx - top},${cy} A${top},${top} 0 0 1 ${cx + top},${cy}`}
        fill="none"
        stroke="none"
      />
      <path
        id={`${id}-bottom`}
        d={`M${cx - bottom},${cy} A${bottom},${bottom} 0 0 0 ${cx + bottom},${cy}`}
        fill="none"
        stroke="none"
      />
    </>
  )
}

// Lettering that measures as set: tabular figures, capital punctuation (Allo's `case`), the
// optical size the metrics were taken at, and centred on its ink, since browsers add
// letter-spacing after the last character too.
const letterStyle = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: "'case'",
  fontVariationSettings: `'opsz' ${glyphs.opticalSize}`,
}

export function Text({
  x,
  y,
  size,
  weight = 700,
  spacing = 0.06,
  anchor = 'middle',
  within,
  outside,
  fill,
  hidden,
  children,
}: {
  x: number
  y: number
  size: number
  weight?: number
  spacing?: number
  anchor?: 'start' | 'middle' | 'end'
  within?: string
  outside?: string
  fill?: string
  // Laid out but not drawn: the measurable twin of lettering knocked out through a mask.
  hidden?: boolean
  children: ReactNode
}) {
  const trail = anchor === 'start' ? 0 : (spacing * size) / (anchor === 'middle' ? 2 : 1)
  return (
    <text
      x={x}
      y={y}
      dx={trail ? trail.toFixed(2) : undefined}
      fontSize={size.toFixed(2)}
      fontWeight={weight}
      letterSpacing={`${spacing.toFixed(3)}em`}
      textAnchor={anchor}
      stroke="none"
      fill={fill}
      visibility={hidden ? 'hidden' : undefined}
      data-within={within}
      data-outside={outside}
      style={letterStyle}
    >
      {children}
    </text>
  )
}

export function ArcText({
  path,
  size,
  weight,
  spacing,
  within,
  outside,
  fill,
  hidden,
  children,
}: {
  path: string
  size: number
  weight: number
  spacing: number
  within?: string
  outside?: string
  fill?: string
  hidden?: boolean
  children: string
}) {
  return (
    <text
      dx={((spacing * size) / 2).toFixed(2)}
      fontSize={size.toFixed(2)}
      fontWeight={weight}
      letterSpacing={`${spacing.toFixed(3)}em`}
      stroke="none"
      textAnchor="middle"
      fill={fill}
      visibility={hidden ? 'hidden' : undefined}
      data-within={within}
      data-outside={outside}
      style={letterStyle}
    >
      <textPath href={`#${path}`} startOffset="50%">
        {children}
      </textPath>
    </text>
  )
}

// Ornaments mark themselves `data-keepout`, which every line in the postmark must clear.
function Star({ x, y, r }: { x: number; y: number; r: number }) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? r : r * 0.45
    const angle = -Math.PI / 2 + (index * Math.PI) / 5
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`
  })
  return <polygon points={points.join(' ')} stroke="none" data-keepout={ellipseSpec(x, y, r)} />
}

function Dot({ x, y, r }: { x: number; y: number; r: number }) {
  return <circle cx={x} cy={y} r={r} stroke="none" data-keepout={ellipseSpec(x, y, r)} />
}

// The style's ornament at (x, y), `r` the star's reach.
export function OrnamentMark({ kit, x, y, r }: { kit: Kit; x: number; y: number; r: number }) {
  if (kit.style.ornament === 'stars') return <Star x={x} y={y} r={r} />
  if (kit.style.ornament === 'dots') return <Dot x={x} y={y} r={r * 0.55} />
  return null
}

// A round frame's border in the style's border, and how near it comes to the middle (its reach):
// a single line, a heavy line with a thin one inside, or a ring of beads.
export function circleBorder(kit: Kit, cx: number, cy: number, r: number, width: number) {
  const { border } = kit.style
  if (border === 'double') {
    return {
      reach: r - 5.5 - 0.6,
      drawn: (
        <>
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={width} />
          <circle cx={cx} cy={cy} r={r - 5.5} fill="none" strokeWidth={1.2} />
        </>
      ),
    }
  }
  if (border === 'beaded') {
    // A whole number of beads, about 7 units apart.
    const count = Math.round((Math.PI * 2 * r) / 7)
    return {
      reach: r - width * 0.75,
      drawn: (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={width * 1.5}
          strokeLinecap="round"
          strokeDasharray={`0 ${((Math.PI * 2 * r) / count).toFixed(3)}`}
        />
      ),
    }
  }
  return {
    reach: r - width / 2,
    drawn: <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={width} />,
  }
}

export function Ticks({
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

function hasPictorial(key: string): key is keyof typeof pictorials {
  return Object.hasOwn(pictorials, key)
}

function pictorialOf(kit: Kit) {
  const { key } = kit.place
  return kit.outline || !hasPictorial(key) ? undefined : pictorials[key]
}

// What the picture shows, for the postmark's accessible name.
export function subjectOf(kit: Kit) {
  return pictorialOf(kit)?.subject ?? `map of ${kit.place.name}`
}

// The place's picture in a `size` square at (x, y): its pictorial, drawn as a die would cut it,
// or else its map outline.
export function Art({ kit, x, y, size }: { kit: Kit; x: number; y: number; size: number }) {
  const pictorial = pictorialOf(kit)
  if (pictorial) {
    return (
      <svg x={x} y={y} width={size} height={size} viewBox="0 0 100 100" overflow="visible">
        <g {...pictorialStroke}>{pictorial.draw(`${kit.id}-art`)}</g>
      </svg>
    )
  }
  const scale = size / 100
  const style = kit.design.outlineStyle
  return (
    <path
      d={kit.place.outline}
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill={
        style === 'fill' ? 'currentColor' : style === 'hatch' ? `url(#${kit.id}-hatch)` : 'none'
      }
      stroke="currentColor"
      strokeWidth={style === 'fill' ? 0 : 2.4 / scale}
      strokeLinejoin="round"
    />
  )
}

// The box the picture's ink actually covers at (x, y) and `size`, which lettering clears: a
// pictorial's measured ink box, or the outline's whole square.
export function artInk(kit: Kit, x: number, y: number, size: number) {
  const pictorial = pictorialOf(kit)
  if (!pictorial) return { x, y, w: size, h: size }
  const [ix, iy, iw, ih] = pictorial.ink
  const scale = size / 100
  return { x: x + ix * scale, y: y + iy * scale, w: iw * scale, h: ih * scale }
}

export function artSpec(kit: Kit, x: number, y: number, size: number) {
  const ink = artInk(kit, x, y, size)
  return boxSpec(ink.x, ink.y, ink.w, ink.h)
}
