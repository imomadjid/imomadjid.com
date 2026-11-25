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

// A font size that fits `text` along `length` units, at most `max`.
function fit(text: string, length: number, max: number) {
  return Math.min(max, length / (text.length * 0.68))
}

function polygonPath(cx: number, cy: number, radius: number, sides: number, turn: number) {
  const points = Array.from({ length: sides }, (_, index) => {
    const angle = turn + (index / sides) * Math.PI * 2
    return `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`
  })
  return `M${points.join('L')}Z`
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
      className={`overflow-visible text-[var(--ink)] dark:text-[var(--ink-dark)] ${className ?? ''}`}
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
  children,
}: {
  x: number
  y: number
  size: number
  weight?: number
  spacing?: number
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
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {children}
    </text>
  )
}

function RoundLayout({ id, place, design, print }: LayoutProps) {
  const [cx, cy] = [110, 110]
  const border =
    design.shape === 'octagon'
      ? polygonPath(cx, cy, 104, 8, Math.PI / 8)
      : design.shape === 'hexagon'
        ? polygonPath(cx, cy, 106, 6, 0)
        : undefined
  const name = place.name.toUpperCase()
  const bottom = (place.country === place.name ? place.region : place.country).toUpperCase()
  const topRadius = 78
  const bottomRadius = 88
  const arcRoom = Math.PI * topRadius * (design.stars ? 0.74 : 0.86)

  return (
    <>
      {border ? (
        <path d={border} fill="none" strokeWidth={3} strokeLinejoin="round" />
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
      <text
        fontSize={fit(name, arcRoom, 22)}
        fontWeight={800}
        letterSpacing="0.08em"
        stroke="none"
        textAnchor="middle"
      >
        <textPath href={`#${id}-top`} startOffset="50%">
          {name}
        </textPath>
      </text>
      <text
        fontSize={fit(bottom, arcRoom, 13)}
        fontWeight={600}
        letterSpacing="0.16em"
        stroke="none"
        textAnchor="middle"
      >
        <textPath href={`#${id}-bottom`} startOffset="50%">
          {bottom}
        </textPath>
      </text>
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
          <Text x={cx} y={cy + 8.5} size={15} weight={800}>
            {print.date}
          </Text>
          <Text x={cx} y={cy + 27} size={7} weight={600} spacing={0.18}>
            {design.label.toUpperCase()} · NO.{print.serial}
          </Text>
        </>
      ) : (
        <>
          <Outline id={id} place={place} design={design} x={cx - 30} y={cy - 46} box={60} />
          <Text x={cx} y={cy + 32} size={14} weight={800}>
            {print.date}
          </Text>
          <Text x={cx} y={cy + 47} size={8} weight={600} spacing={0.2}>
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
  const [tx, ty] = [rx - 22, ry - 22]
  const [bx, by] = [rx - 12, ry - 12]
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
      <text
        fontSize={fit(name, 200, 20)}
        fontWeight={800}
        letterSpacing="0.08em"
        stroke="none"
        textAnchor="middle"
      >
        <textPath href={`#${id}-top`} startOffset="50%">
          {name}
        </textPath>
      </text>
      <text
        fontSize={fit(bottom, 200, 12)}
        fontWeight={600}
        letterSpacing="0.16em"
        stroke="none"
        textAnchor="middle"
      >
        <textPath href={`#${id}-bottom`} startOffset="50%">
          {bottom}
        </textPath>
      </text>
      <Outline id={id} place={place} design={design} x={cx - 80} y={cy - 18} box={36} />
      <Text x={cx + 20} y={cy + 4} size={13} weight={800}>
        {print.date}
      </Text>
      <Text x={cx + 20} y={cy + 17} size={7} weight={600} spacing={0.2}>
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
  const frame =
    design.shape === 'notched'
      ? `M${inset + notch},${inset} H${width - inset - notch} L${width - inset},${inset + notch} V${height - inset - notch} L${width - inset - notch},${height - inset} H${inset + notch} L${inset},${height - inset - notch} V${inset + notch} Z`
      : undefined
  const name = place.name.toUpperCase()
  return (
    <>
      {frame ? (
        <path d={frame} fill="none" strokeWidth={3} strokeLinejoin="round" />
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
      {design.innerRing && (
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
      <Text x={width / 2} y={46} size={fit(name, width - 60, 26)} weight={800} spacing={0.08}>
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
      <Outline id={id} place={place} design={design} x={30} y={68} box={72} />
      <Text x={180} y={96} size={18} weight={800}>
        {print.date}
      </Text>
      <Text x={180} y={114} size={10} weight={600} spacing={0.14}>
        {place.region.toUpperCase()}
      </Text>
      <Text x={180} y={128} size={10} weight={600} spacing={0.14}>
        {place.country.toUpperCase()}
      </Text>
      <Text x={180} y={150} size={8} weight={600} spacing={0.22}>
        {design.label.toUpperCase()} · NO.{print.serial}
      </Text>
    </>
  )
}
