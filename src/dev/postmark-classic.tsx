import type { Drawn } from './postmark-families'
import {
  arcPaths,
  ArcText,
  Art,
  artSpec,
  boxSpec,
  centred,
  dateOf,
  ellipseSpec,
  gap,
  inkHeights,
  line,
  OrnamentMark,
  pathOf,
  polygonPoints,
  polygonSpec,
  rimLettering,
  Text,
  Ticks,
} from './postmark-kit'
import type { Kit, Shape } from './postmark-kit'

// The prototype's own stamps: round (circle, double circle, octagon, hexagon), oval, and
// rectangular with square or notched corners.
export function classic(kit: Kit): Drawn {
  const { shape } = kit.design
  if (shape === 'oval') return { width: 250, height: 180, body: ovalLayout(kit) }
  if (shape === 'rect' || shape === 'notched') {
    return { width: 260, height: 170, body: rectLayout(kit, 260, 170) }
  }
  return { width: 220, height: 220, body: roundLayout(kit) }
}

function roundBorder(shape: Shape, cx: number, cy: number) {
  const half = 1.5
  const polygon = (radius: number, sides: number, turn: number) => {
    const inset = half / Math.cos(Math.PI / sides)
    return {
      path: pathOf(polygonPoints(cx, cy, radius, sides, turn)),
      inner: polygonSpec(polygonPoints(cx, cy, radius - inset, sides, turn)),
      // The nearest the border comes to the middle.
      reach: (radius - inset) * Math.cos(Math.PI / sides),
    }
  }
  if (shape === 'octagon') return polygon(104, 8, Math.PI / 8)
  if (shape === 'hexagon') return polygon(106, 6, 0)
  const reach = shape === 'double-circle' ? 93 - 0.7 : 100 - half
  return { path: undefined, inner: ellipseSpec(cx, cy, reach), reach }
}

function roundLayout(kit: Kit) {
  const { id, place, design, print } = kit
  const [cx, cy] = [110, 110]
  const border = roundBorder(design.shape, cx, cy)
  const stars = kit.style.ornament === 'stars'
  const name = place.name.toUpperCase()
  const bottom = (place.country === place.name ? place.region : place.country).toUpperCase()
  // What the lettering must stay outside: the inner ring, its ticks, or the content they frame.
  const ring = design.innerRing ? 64.8 : design.ticks ? 66.7 : 62
  // How much of each arc the lettering may cover, leaving the sides for the stars.
  const span = (stars ? 0.74 : 0.86) * Math.PI

  const rim = rimLettering(kit, {
    reach: border.reach,
    ring,
    name,
    bottom,
    span,
  })
  const ringSpec = ellipseSpec(cx, cy, ring + 0.5)
  const insideRing = ellipseSpec(cx, cy, design.innerRing ? 63.2 : 60)
  const date = dateOf(kit)
  const label = design.label.toUpperCase()
  const bandLabel = `${label} · NO.${print.serial}`
  const bandDate = line(kit, date, 'heavy', 0.06, 112, 15)
  const stackDate = line(kit, date, 'heavy', 0.06, 96, 13)

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

      {arcPaths(id, cx, cy, rim.topRadius, rim.bottomRadius)}
      <ArcText path={`${id}-top`} {...rim.name} within={border.inner} outside={ringSpec}>
        {name}
      </ArcText>
      <ArcText path={`${id}-bottom`} {...rim.bottom} within={border.inner} outside={ringSpec}>
        {bottom}
      </ArcText>
      <OrnamentMark kit={kit} x={cx - 82} y={cy + 4} r={5.5} />
      <OrnamentMark kit={kit} x={cx + 82} y={cy + 4} r={5.5} />

      {design.layout === 'band' ? (
        <>
          <Art kit={kit} x={cx - 19} y={cy - 54} size={38} />
          <line x1={cx - 58} x2={cx + 58} y1={cy - 10} y2={cy - 10} strokeWidth={1.6} />
          <line x1={cx - 58} x2={cx + 58} y1={cy + 14} y2={cy + 14} strokeWidth={1.6} />
          <Text x={cx} y={centred(bandDate, cy + 2)} {...bandDate} within={insideRing}>
            {date}
          </Text>
          <Text
            x={cx}
            y={cy + 27}
            {...line(kit, bandLabel, 'light', 0.18, 96, 7)}
            within={insideRing}
          >
            {bandLabel}
          </Text>
        </>
      ) : (
        <>
          <Art kit={kit} x={cx - 28} y={cy - 48} size={56} />
          <Text
            x={cx}
            y={cy + 26}
            {...stackDate}
            within={insideRing}
            outside={artSpec(kit, cx - 28, cy - 48, 56)}
          >
            {date}
          </Text>
          <Text x={cx} y={cy + 42} {...line(kit, label, 'light', 0.2, 72, 8)} within={insideRing}>
            {label}
          </Text>
        </>
      )}
    </>
  )
}

function ovalLayout(kit: Kit) {
  const { id, place, design, print } = kit
  const [cx, cy, rx, ry] = [125, 90, 118, 82]
  const name = place.name.toUpperCase()
  const bottom = place.country.toUpperCase()
  // The border's inner edge, and the inner ring's outer edge (or where the content ends).
  const [ix, iy] = [rx - 1.5, ry - 1.5]
  const [kx, ky] = design.innerRing ? [rx - 29.3, ry - 29.3] : [rx - 30, ry - 30]
  // Roughly half the ellipse's perimeter at the lettering, three quarters of it usable.
  const room = 0.75 * Math.PI * Math.sqrt(((ix - 10) ** 2 + (iy - 10) ** 2) / 2)
  const band = iy - ky - gap * 2
  const top = inkHeights(name)
  const under = inkHeights(bottom)
  const nameSet = line(
    kit,
    name,
    'heavy',
    0.08,
    room,
    Math.min(20, band / (top.ascent + top.descent)),
  )
  const bottomSet = line(
    kit,
    bottom,
    'light',
    0.16,
    room,
    Math.min(12, band / (under.ascent + under.descent)),
  )
  const [tx, ty] = [ix - gap - nameSet.ascent, iy - gap - nameSet.ascent]
  const [bx, by] = [ix - gap - bottomSet.descent, iy - gap - bottomSet.descent]
  const date = dateOf(kit)
  const label = `${design.label.toUpperCase()} · NO.${print.serial}`
  const within = ellipseSpec(cx, cy, ix, iy)
  const ringSpec = ellipseSpec(cx, cy, kx + 0.5, ky + 0.5)
  const insideRing = ellipseSpec(cx, cy, kx - 1.5, ky - 1.5)
  const outline = artSpec(kit, cx - 80, cy - 18, 36)
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
      <ArcText path={`${id}-top`} {...nameSet} within={within} outside={ringSpec}>
        {name}
      </ArcText>
      <ArcText path={`${id}-bottom`} {...bottomSet} within={within} outside={ringSpec}>
        {bottom}
      </ArcText>
      <Art kit={kit} x={cx - 80} y={cy - 18} size={36} />
      <Text
        x={cx + 20}
        y={cy + 4}
        {...line(kit, date, 'heavy', 0.06, 104, 13)}
        within={insideRing}
        outside={outline}
      >
        {date}
      </Text>
      <Text
        x={cx + 20}
        y={cy + 17}
        {...line(kit, label, 'light', 0.2, 100, 7)}
        within={insideRing}
        outside={outline}
      >
        {label}
      </Text>
    </>
  )
}

function rectLayout(kit: Kit, width: number, height: number) {
  const { place, design, print } = kit
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
  // The bottom line sits where a notched frame's corner cuts in: it centres on the column within
  // the edge's reach at its lowest ink (about 152), a gap clear of it.
  const cut = notch - (edge - inset) * (2 - Math.SQRT2)
  const cornerAt = (y: number) => width - edge - Math.max(0, y - (height - edge - cut))
  const bottomRoom = notched
    ? Math.min(column.room, 2 * (cornerAt(152) - gap - column.x))
    : column.room
  const avoid = artSpec(kit, outline.x, outline.y, outline.box)
  const date = dateOf(kit)
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
        {...line(kit, name, 'heavy', 0.08, width - 60, 26)}
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
      <Art kit={kit} x={outline.x} y={outline.y} size={outline.box} />
      <Text
        x={column.x}
        y={96}
        {...line(kit, date, 'heavy', 0.06, column.room, 18)}
        within={within}
        outside={avoid}
      >
        {date}
      </Text>
      <Text
        x={column.x}
        y={114}
        {...line(kit, region, 'light', 0.14, column.room, 10)}
        within={within}
        outside={avoid}
      >
        {region}
      </Text>
      <Text
        x={column.x}
        y={128}
        {...line(kit, country, 'light', 0.14, column.room, 10)}
        within={within}
        outside={avoid}
      >
        {country}
      </Text>
      <Text
        x={column.x}
        y={150}
        {...line(kit, label, 'light', 0.22, bottomRoom, 8)}
        within={within}
        outside={avoid}
      >
        {label}
      </Text>
    </>
  )
}
