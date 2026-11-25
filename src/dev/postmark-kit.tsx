import type { ReactNode } from 'react'

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
    ink: pick(next, inks),
    outlineStyle: pick(next, outlineStyles),
    layout: pick(next, layouts),
    label: pick(next, labels),
    innerRing: next() < 0.6,
    ticks: next() < 0.45,
    stars: next() < 0.5,
    family: pick(next, families),
    // A family's own alternative: a ground chord, a solid banner, a square seal, a frame.
    variant: next() < 0.5,
    // Where a wavy cancel's picture falls along its lines, 0 to 1.
    along: next(),
  }
}

export type Design = ReturnType<typeof postmarkDesign>

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

export function monthName(print: Print) {
  return months[print.month] ?? ''
}

// Everything a layout draws from.
export type Kit = {
  id: string
  place: PostmarkPlace
  design: Design
  print: Print
  // Draw the map outline even where the place has a pictorial.
  outline: boolean
}

// Allo's capitals, measured in Chromium at weights 600 to 800: caps stand 0.73 em tall, letters
// average 0.67 em wide (M and W about 1 em), tabular figures 0.57 em, a space 0.19 em.
export const capHeight = 0.73
// The room left between lettering and any rule, ring or border, in viewBox units.
export const gap = 4

export function textUnits(text: string, spacing: number) {
  let units = 0
  for (const char of text) {
    if (char === ' ') units += 0.2
    else if (char >= '0' && char <= '9') units += 0.57
    else if (char === 'M' || char === 'W') units += 1
    else if (char === '·' || char === '.' || char === ',') units += 0.3
    else units += 0.68
    units += spacing
  }
  return units
}

// A font size that sets `text` within `length` units, at most `max`.
export function fit(text: string, length: number, max: number, spacing: number) {
  return Math.min(max, length / textUnits(text, spacing))
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
// or the content inside (`ring`). The name sits as far out as it can, its caps a gap inside the
// border; the bottom line hangs its caps inward from a baseline a gap inside it. `span` is how much
// of each arc the lettering may cover.
export function rimLettering({
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
}) {
  const nameSize = Math.min(
    nameMax,
    (reach - ring - gap * 2) / capHeight,
    (span * (ring + gap)) / textUnits(name, 0.08),
  )
  const bottomRadius = reach - gap
  const bottomSize = Math.min(
    bottomMax,
    (bottomRadius - ring - gap) / capHeight,
    (span * (bottomRadius - capHeight * bottomMax)) / textUnits(bottom, 0.16),
  )
  return { nameSize, topRadius: reach - gap - capHeight * nameSize, bottomSize, bottomRadius }
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
  return (
    <text
      x={x}
      y={y}
      fontSize={size.toFixed(2)}
      fontWeight={weight}
      letterSpacing={`${spacing}em`}
      textAnchor={anchor}
      stroke="none"
      fill={fill}
      visibility={hidden ? 'hidden' : undefined}
      data-within={within}
      data-outside={outside}
      style={{ fontVariantNumeric: 'tabular-nums' }}
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
      fontSize={size.toFixed(2)}
      fontWeight={weight}
      letterSpacing={`${spacing}em`}
      stroke="none"
      textAnchor="middle"
      fill={fill}
      visibility={hidden ? 'hidden' : undefined}
      data-within={within}
      data-outside={outside}
    >
      <textPath href={`#${path}`} startOffset="50%">
        {children}
      </textPath>
    </text>
  )
}

export function Star({ x, y, r }: { x: number; y: number; r: number }) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? r : r * 0.45
    const angle = -Math.PI / 2 + (index * Math.PI) / 5
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`
  })
  return <polygon points={points.join(' ')} stroke="none" />
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
