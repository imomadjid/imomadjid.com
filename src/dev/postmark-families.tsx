import type { ReactNode } from 'react'

import {
  arcPaths,
  ArcText,
  Art,
  artInk,
  artSpec,
  boxSpec,
  capHeight,
  centred,
  circleBorder,
  dateOf,
  ellipseSpec,
  gap,
  inkHeights,
  insetPolygon,
  line,
  monthName,
  OrnamentMark,
  pathOf,
  polygonSpec,
  rimLettering,
  Text,
  textUnits,
} from './postmark-kit'
import type { Family, Kit, Line, Point } from './postmark-kit'

// Postmark layout families after real postmarks, as the design research describes them (sizes
// from Japan Post's scenic postmarks, Deutsche Post's special-handstamp rules, USPS pictorial
// postmarks and Schengen passport stamps, thickened for a screen). Each returns its viewBox and
// what it draws; round ones use a 220 box centred on (110, 110), as the classic stamps do.
//
// A family is a structure: it places the frame, the picture and the slots for its lines. What
// fills the slots comes from the kit's style (lettering weight and tracking, date format,
// ornaments, border), and every line is sized from that choice by `line`, so each combination
// the family accepts (familyAccepts in postmark-kit.tsx) fits its slots.

export type Drawn = { width: number; height: number; body: ReactNode }

const upper = (text: string) => text.toUpperCase()

// The line under the name: the region, or the country for a city-state.
function regionLine(kit: Kit) {
  const { place } = kit
  return upper(place.region === place.name ? place.country : place.region)
}

function countryLine(kit: Kit) {
  const { place } = kit
  return upper(place.country === place.name ? place.region : place.country)
}

function greeting(kit: Kit) {
  return kit.place.countryCode === 'ID' ? 'SALAM DARI' : 'GREETINGS FROM'
}

const two = (value: number) => String(value).padStart(2, '0')

// How wide a set line's ink is, in viewBox units.
function inkWidth(text: string, set: Line) {
  return (textUnits(text, set.spacing, set.weight) - set.spacing) * set.size
}

// Japan's scenic postmark: the picture is the stamp, with the date in a pill and the office's
// name along the bottom.
function fukeiin(kit: Kit): Drawn {
  const { id, design, place } = kit
  const [cx, cy] = [110, 110]
  const border = circleBorder(kit, cx, cy, 100, 2.6)
  const name = upper(place.name)
  const date = dateOf(kit)
  const heights = inkHeights(name)
  const nameSet = line(
    kit,
    name,
    'mid',
    0.22,
    Math.PI * 0.8 * (border.reach - gap - (heights.ascent + heights.descent) * 13),
    13,
  )
  // The name hangs under the bottom, its descenders a gap in from the border.
  const radius = border.reach - gap - Math.max(0.7, nameSet.descent)
  // The ornaments stand just past each end of the name, in the middle of its caps.
  const half = inkWidth(name, nameSet) / (radius - nameSet.ascent) / 2 + 0.16
  const mark = (side: number): Point => {
    const middle = radius - (capHeight * nameSet.size) / 2
    return [cx + side * Math.sin(half) * middle, cy + Math.cos(half) * middle]
  }
  const pill = { x: 72, y: 148, w: 76, h: 20 }
  const art = { x: 52, y: 20, size: 116 }
  const dateSet = line(kit, date, 'heavy', 0.06, pill.w - 18, 13)
  const ground = Math.sqrt(border.reach ** 2 - (141 - cy) ** 2) - 1
  return {
    width: 220,
    height: 220,
    body: (
      <>
        {border.drawn}
        {design.variant && (
          <line x1={cx - ground} x2={cx + ground} y1={141} y2={141} strokeWidth={2.2} />
        )}
        <Art kit={kit} {...art} />
        <rect
          x={pill.x}
          y={pill.y}
          width={pill.w}
          height={pill.h}
          rx={10}
          fill="none"
          strokeWidth={1.8}
        />
        <Text
          x={cx}
          y={centred(dateSet, pill.y + pill.h / 2)}
          {...dateSet}
          within={boxSpec(pill.x, pill.y, pill.w, pill.h)}
        >
          {date}
        </Text>
        {arcPaths(id, cx, cy, radius, radius)}
        <ArcText
          path={`${id}-bottom`}
          {...nameSet}
          within={ellipseSpec(cx, cy, border.reach)}
          outside={`${boxSpec(pill.x, pill.y, pill.w, pill.h)};${artSpec(kit, art.x, art.y, art.size)}`}
        >
          {name}
        </ArcText>
        {[-1, 1].map((side) => {
          const [x, y] = mark(side)
          return <OrnamentMark key={side} kit={kit} x={x} y={y} r={4.7} />
        })}
      </>
    ),
  }
}

// Japan's station stamp: a bold rounded panel, a big scene, the name in a banner and the date in
// a small seal in the corner.
function eki(kit: Kit): Drawn {
  const { design, print, place } = kit
  const name = upper(place.name)
  const sub = regionLine(kit)
  const banner = { x: 14, y: 156, w: 192, h: 50 }
  const nameSet = line(kit, name, 'heavy', 0.06, banner.w - 16, 22)
  const subSet = line(kit, sub, 'light', 0.2, banner.w - 24, 8)
  const seal = { cx: 34, cy: 34, r: 18 }
  const day = two(print.day)
  const month = monthName(print)
  const daySet = line(kit, day, 'heavy', 0.06, 24, 13)
  const monthSet = line(kit, month, 'mid', 0.12, 22, 6.5)
  const art = { x: 56, y: 24, size: 118 }
  const within = boxSpec(banner.x, banner.y, banner.w, banner.h)
  const inSeal = ellipseSpec(seal.cx, seal.cy, seal.r - 1)
  return {
    width: 220,
    height: 220,
    body: (
      <>
        <rect x={8} y={8} width={204} height={204} rx={18} fill="none" strokeWidth={4} />
        <line x1={8} x2={212} y1={150} y2={150} strokeWidth={design.variant ? 2.4 : 4} />
        {design.variant && <line x1={8} x2={212} y1={155} y2={155} strokeWidth={1.4} />}
        <Art kit={kit} {...art} />
        <circle cx={seal.cx} cy={seal.cy} r={seal.r} fill="none" strokeWidth={1.8} />
        <Text x={seal.cx} y={seal.cy + 2} {...daySet} within={inSeal}>
          {day}
        </Text>
        <Text x={seal.cx} y={seal.cy + 11} {...monthSet} within={inSeal}>
          {month}
        </Text>
        <Text x={110} y={186} {...nameSet} within={within}>
          {name}
        </Text>
        <Text x={110} y={200} {...subSet} within={within}>
          {sub}
        </Text>
      </>
    ),
  }
}

// Deutsche Post's special handstamp: the name replaces the top of the border, the region the
// bottom; the picture sits above a ruled date field.
function sonderstempel(kit: Kit): Drawn {
  const { id, print, place } = kit
  const [cx, cy] = [110, 110]
  const name = upper(place.name)
  const sub = regionLine(kit)
  // The name's ink straddles the border's circle, reaching at most 8 units either side of it.
  const heights = inkHeights(name)
  const nameSet = line(
    kit,
    name,
    'heavy',
    0.1,
    Math.PI * 0.72 * 94,
    Math.min(16, 16 / (heights.ascent + heights.descent)),
  )
  const baseline = 100 - (nameSet.ascent - nameSet.descent) / 2
  const nameHalf = inkWidth(name, nameSet) / baseline / 2
  // The border breaks a word space past each end of the name, where an ornament stands.
  const breakAngle = nameHalf + 0.17
  const markAngle = nameHalf + 0.09
  const subSet = line(kit, sub, 'mid', 0.1, 84, 12)
  const bottomHalf = Math.asin(Math.min(0.95, inkWidth(sub, subSet) / 2 / 100 + 0.12))
  const top = -Math.PI / 2
  const bottomMid = Math.PI / 2
  const arc = (from: number, to: number) => {
    const [x1, y1] = [cx + 100 * Math.cos(from), cy + 100 * Math.sin(from)]
    const [x2, y2] = [cx + 100 * Math.cos(to), cy + 100 * Math.sin(to)]
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A100 100 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
  }
  const field = { x: 62, y: 130, w: 96, h: 30 }
  const date = dateOf(kit)
  const dateSet = line(kit, date, 'heavy', 0.02, field.w - 10, 14)
  const serial = `NO.${print.serial}`
  const serialSet = line(kit, serial, 'light', 0.2, 70, 7.5)
  const art = { x: 68, y: 34, size: 84 }
  const outer = ellipseSpec(cx, cy, 108)
  return {
    width: 220,
    height: 220,
    body: (
      <>
        <path
          d={`${arc(top + breakAngle, bottomMid - bottomHalf)} ${arc(bottomMid + bottomHalf, top - breakAngle + Math.PI * 2)}`}
          fill="none"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        {arcPaths(id, cx, cy, baseline, 0)}
        <ArcText
          path={`${id}-top`}
          {...nameSet}
          within={ellipseSpec(cx, cy, 110)}
          outside={artSpec(kit, art.x, art.y, art.size)}
        >
          {name}
        </ArcText>
        {/* Where the posthorns stand on a German stamp. */}
        {[-1, 1].map((side) => (
          <OrnamentMark
            key={side}
            kit={kit}
            x={cx + side * Math.sin(markAngle) * 100}
            y={cy - Math.cos(markAngle) * 100}
            r={4.5}
          />
        ))}
        <Text x={cx} y={centred(subSet, 196)} {...subSet} within={outer}>
          {sub}
        </Text>
        <Art kit={kit} {...art} />
        <line x1={field.x} x2={field.x + field.w} y1={field.y} y2={field.y} strokeWidth={1.6} />
        <line
          x1={field.x}
          x2={field.x + field.w}
          y1={field.y + field.h}
          y2={field.y + field.h}
          strokeWidth={1.6}
        />
        <Text
          x={cx}
          y={centred(dateSet, field.y + field.h / 2)}
          {...dateSet}
          within={boxSpec(field.x, field.y, field.w, field.h)}
        >
          {date}
        </Text>
        <Text x={cx} y={176} {...serialSet} within={ellipseSpec(cx, cy, 98)}>
          {serial}
        </Text>
      </>
    ),
  }
}

// The British and American circular date stamp: two rings, the date across a bridge, a small
// picture in the inner circle's upper part.
function bridge(kit: Kit): Drawn {
  const { id, print, place } = kit
  const [cx, cy] = [110, 110]
  const border = circleBorder(kit, cx, cy, 100, 3)
  const name = upper(place.name)
  const bottom = countryLine(kit)
  const rim = rimLettering(kit, {
    reach: border.reach,
    ring: 62.8,
    name,
    bottom,
    span: 0.62 * Math.PI,
  })
  const date = dateOf(kit)
  const dateSet = line(kit, date, 'heavy', 0.06, 112, 15)
  const serial = `NO.${print.serial}`
  const serialSet = line(kit, serial, 'light', 0.2, 60, 8)
  const chord = (y: number) => Math.sqrt(border.reach ** 2 - (y - cy) ** 2)
  const ring = ellipseSpec(cx, cy, 63.5)
  const rim2 = ellipseSpec(cx, cy, border.reach)
  // The ornaments stand either side, midway between the rings.
  const side = (border.reach + 62.8) / 2
  const art = { x: 86, y: 47, size: 48 }
  return {
    width: 220,
    height: 220,
    body: (
      <>
        {border.drawn}
        <circle cx={cx} cy={cy} r={62} fill="none" strokeWidth={1.6} />
        {[98, 124].map((y) => (
          <line key={y} x1={cx - chord(y)} x2={cx + chord(y)} y1={y} y2={y} strokeWidth={1.8} />
        ))}
        <Text x={cx} y={centred(dateSet, 111)} {...dateSet} within={boxSpec(50, 99, 120, 24)}>
          {date}
        </Text>
        {arcPaths(id, cx, cy, rim.topRadius, rim.bottomRadius)}
        <ArcText path={`${id}-top`} {...rim.name} within={rim2} outside={ring}>
          {name}
        </ArcText>
        <ArcText path={`${id}-bottom`} {...rim.bottom} within={rim2} outside={ring}>
          {bottom}
        </ArcText>
        <OrnamentMark kit={kit} x={cx - side} y={111} r={5} />
        <OrnamentMark kit={kit} x={cx + side} y={111} r={5} />
        <Art kit={kit} {...art} />
        <Text x={cx} y={146} {...serialSet} within={ellipseSpec(cx, cy, 60)}>
          {serial}
        </Text>
      </>
    ),
  }
}

// A date stamp beside a barred oval, the obliterator, here with a window for the picture.
function duplex(kit: Kit): Drawn {
  const { id, place } = kit
  const [cx, cy] = [85, 85]
  const border = circleBorder(kit, cx, cy, 72, 2.6)
  const name = upper(place.name)
  const bottom = countryLine(kit)
  const rim = rimLettering(kit, {
    reach: border.reach,
    ring: 40.8,
    name,
    bottom,
    span: 0.72 * Math.PI,
    nameMax: 15,
    bottomMax: 10,
  })
  const date = dateOf(kit)
  const dateSet = line(kit, date, 'heavy', 0.06, 60, 14)
  const half = (y: number) => Math.sqrt(40 ** 2 - (y - cy) ** 2) - 1
  const killer = { cx: 250, cy: 85, rx: 78, ry: 76 }
  const window = 50
  const art = { x: 210, y: 45, size: 80 }
  const bars = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => {
    const y = killer.cy + k * 16
    const width = killer.rx * Math.sqrt(1 - ((y - killer.cy) / killer.ry) ** 2) - 3.75
    const open = Math.abs(k) <= 2
    return { y, width, open }
  })
  const within = ellipseSpec(cx, cy, border.reach)
  const ring = ellipseSpec(cx, cy, 41.5)
  return {
    width: 330,
    height: 170,
    body: (
      <>
        {border.drawn}
        <circle cx={cx} cy={cy} r={40} fill="none" strokeWidth={1.6} />
        {[72, 98].map((y) => (
          <line key={y} x1={cx - half(y)} x2={cx + half(y)} y1={y} y2={y} strokeWidth={1.6} />
        ))}
        <Text
          x={cx}
          y={centred(dateSet, 85)}
          {...dateSet}
          within={boxSpec(cx - half(72), 72.8, half(72) * 2, 24.4)}
        >
          {date}
        </Text>
        {arcPaths(id, cx, cy, rim.topRadius, rim.bottomRadius)}
        <ArcText path={`${id}-top`} {...rim.name} within={within} outside={ring}>
          {name}
        </ArcText>
        <ArcText path={`${id}-bottom`} {...rim.bottom} within={within} outside={ring}>
          {bottom}
        </ArcText>
        <g strokeWidth={7.5} strokeLinecap="round">
          {bars.map(({ y, width, open }) =>
            open ? (
              <g key={y}>
                <line x1={killer.cx - width} x2={killer.cx - window} y1={y} y2={y} />
                <line x1={killer.cx + window} x2={killer.cx + width} y1={y} y2={y} />
              </g>
            ) : (
              <line key={y} x1={killer.cx - width} x2={killer.cx + width} y1={y} y2={y} />
            ),
          )}
        </g>
        <Art kit={kit} {...art} />
      </>
    ),
  }
}

// The small date circle every machine cancel and slogan box starts from.
function dateCircle(kit: Kit, cx: number, cy: number) {
  const { id, place } = kit
  const border = circleBorder(kit, cx, cy, 58, 2.6)
  const name = upper(place.name)
  const bottom = countryLine(kit)
  const date = dateOf(kit)
  const dateSet = line(kit, date, 'heavy', 0.06, 56, 12)
  const rim = rimLettering(kit, {
    reach: border.reach,
    ring: 36,
    name,
    bottom,
    span: 0.78 * Math.PI,
    nameMax: 13,
    bottomMax: 9,
  })
  const inner = ellipseSpec(cx, cy, 36)
  const within = ellipseSpec(cx, cy, border.reach)
  return (
    <>
      {border.drawn}
      <Text x={cx} y={centred(dateSet, cy)} {...dateSet} within={inner}>
        {date}
      </Text>
      {arcPaths(id, cx, cy, rim.topRadius, rim.bottomRadius)}
      <ArcText path={`${id}-top`} {...rim.name} within={within} outside={inner}>
        {name}
      </ArcText>
      <ArcText path={`${id}-bottom`} {...rim.bottom} within={within} outside={inner}>
        {bottom}
      </ArcText>
    </>
  )
}

// A wavy line from x0 to x1, `amplitude` either side of y.
function wave(x0: number, x1: number, y: number, amplitude: number, wavelength: number) {
  let d = `M${x0} ${y}`
  let up = true
  for (let x = x0; x < x1; x += wavelength / 2) {
    const end = Math.min(x + wavelength / 2, x1)
    d += ` Q${((x + end) / 2).toFixed(2)} ${(y + (up ? -2 : 2) * amplitude).toFixed(2)} ${end.toFixed(2)} ${y}`
    up = !up
  }
  return d
}

// A machine cancel: a date circle, then wavy lines, broken where the picture sits.
function wavy(kit: Kit): Drawn {
  const { id, design } = kit
  const art = { x: 170 + design.along * 110, y: 45, size: 60 }
  const ink = artInk(kit, art.x, art.y, art.size)
  return {
    width: 360,
    height: 150,
    body: (
      <>
        {dateCircle(kit, 70, 75)}
        <mask id={`${id}-waves`}>
          <rect width={360} height={150} fill="#fff" />
          <rect x={ink.x - 6} y={ink.y - 6} width={ink.w + 12} height={ink.h + 12} fill="#000" />
        </mask>
        <g mask={`url(#${id}-waves)`} fill="none" strokeWidth={2.4} strokeLinecap="round">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <path key={k} d={wave(140, 352, 40 + k * 14, 4.5, 32)} />
          ))}
        </g>
        <Art kit={kit} {...art} />
      </>
    ),
  }
}

// A slogan box beside the date circle: the picture, a greeting and the name.
function slogan(kit: Kit): Drawn {
  const { design, print, place } = kit
  const name = upper(place.name)
  const hello = greeting(kit)
  const box = { x: 148, y: 23, w: 204, h: 104 }
  const art = { x: 156, y: 33, size: 84 }
  const column = { cx: 296, w: 88 }
  const within = boxSpec(box.x + 2, box.y + 2, box.w - 4, box.h - 4)
  const outside = artSpec(kit, art.x, art.y, art.size)
  const label = `${upper(design.label)} · NO.${print.serial}`
  return {
    width: 360,
    height: 150,
    body: (
      <>
        {dateCircle(kit, 70, 75)}
        <rect
          x={box.x}
          y={box.y}
          width={box.w}
          height={box.h}
          rx={4}
          fill="none"
          strokeWidth={2.6}
        />
        <Art kit={kit} {...art} />
        <Text
          x={column.cx}
          y={58}
          {...line(kit, hello, 'mid', 0.2, column.w, 9)}
          within={within}
          outside={outside}
        >
          {hello}
        </Text>
        <Text
          x={column.cx}
          y={84}
          {...line(kit, name, 'heavy', 0.04, column.w, 20)}
          within={within}
          outside={outside}
        >
          {name}
        </Text>
        <line x1={column.cx - 40} x2={column.cx + 40} y1={95} y2={95} strokeWidth={1.4} />
        <Text
          x={column.cx}
          y={112}
          {...line(kit, label, 'light', 0.16, column.w, 7.5)}
          within={within}
          outside={outside}
        >
          {label}
        </Text>
      </>
    ),
  }
}

// A first-day cancel: frameless, the picture large, the date and place beside it.
function firstDay(kit: Kit): Drawn {
  const { design, place } = kit
  const art = { x: 10, y: 20, size: 110 }
  const column = { cx: 201, w: 128 }
  const label = upper(design.label)
  const date = dateOf(kit)
  const where = `${upper(place.name)}, ${regionLine(kit)}`
  const country = upper(place.country)
  const within = design.variant ? boxSpec(6, 6, 268, 138) : boxSpec(2, 2, 276, 146)
  const outside = artSpec(kit, art.x, art.y, art.size)
  return {
    width: 280,
    height: 150,
    body: (
      <>
        {design.variant && (
          <rect x={4} y={4} width={272} height={142} fill="none" strokeWidth={1.4} />
        )}
        <Art kit={kit} {...art} />
        <Text
          x={column.cx}
          y={46}
          {...line(kit, label, 'mid', 0.24, column.w, 9)}
          within={within}
          outside={outside}
        >
          {label}
        </Text>
        <line x1={140} x2={262} y1={56} y2={56} strokeWidth={1.6} />
        <Text
          x={column.cx}
          y={84}
          {...line(kit, date, 'heavy', 0.04, column.w, 22)}
          within={within}
          outside={outside}
        >
          {date}
        </Text>
        <line x1={171} x2={231} y1={93} y2={93} strokeWidth={1.2} />
        <line x1={171} x2={231} y1={97} y2={97} strokeWidth={1.2} />
        <Text
          x={column.cx}
          y={116}
          {...line(kit, where, 'mid', 0.06, column.w, 11)}
          within={within}
          outside={outside}
        >
          {where}
        </Text>
        <Text
          x={column.cx}
          y={132}
          {...line(kit, country, 'light', 0.16, column.w, 9)}
          within={within}
          outside={outside}
        >
          {country}
        </Text>
      </>
    ),
  }
}

// A Schengen-style passport stamp: square corners for an arrival, rounded for a departure, the
// country code in a box, and the picture where the transport pictogram goes.
function passport(kit: Kit): Drawn {
  const { print, place } = kit
  const departure = print.departure
  const art = { x: 188, y: 12, size: 38 }
  const within = boxSpec(9, 9, 222, 132)
  const outside = artSpec(kit, art.x, art.y, art.size)
  const date = dateOf(kit)
  const label = `${departure ? 'DEPARTED' : 'ARRIVED'} · ${upper(place.name)}`
  const serial = `NO.${print.serial}`
  const codeSet = line(kit, place.countryCode, 'heavy', 0.06, 36, 18)
  const dateSet = line(kit, date, 'heavy', 0.04, 200, 26)
  // An arrow points in for an arrival and out for a departure.
  const arrow = departure ? 'M84 22 L74 30 L84 38 Z' : 'M74 22 L84 30 L74 38 Z'
  return {
    width: 240,
    height: 150,
    body: (
      <>
        <rect
          x={6}
          y={6}
          width={228}
          height={138}
          rx={departure ? 16 : 0}
          fill="none"
          strokeWidth={3}
        />
        <rect x={18} y={16} width={46} height={28} fill="none" strokeWidth={2} />
        <Text x={41} y={centred(codeSet, 30)} {...codeSet} within={boxSpec(18, 16, 46, 28)}>
          {place.countryCode}
        </Text>
        <path d={arrow} stroke="none" />
        <Text
          x={134}
          y={34}
          {...line(kit, serial, 'light', 0.16, 44, 9)}
          within={within}
          outside={outside}
        >
          {serial}
        </Text>
        <Art kit={kit} {...art} />
        <line x1={6} x2={234} y1={56} y2={56} strokeWidth={1.6} />
        <Text x={120} y={centred(dateSet, 94)} {...dateSet} within={within}>
          {date}
        </Text>
        <Text x={120} y={128} {...line(kit, label, 'mid', 0.16, 196, 12)} within={within}>
          {label}
        </Text>
      </>
    ),
  }
}

// A shield, one of Deutsche Post's special-handstamp outlines.
function shield(kit: Kit): Drawn {
  const { place } = kit
  const name = upper(place.name)
  const art = { x: 58, y: 50, size: 82 }
  const date = dateOf(kit)
  return {
    width: 200,
    height: 176,
    body: (
      <>
        <path
          d="M8 8 H192 V96 C192 132, 150 156, 100 170 C50 156, 8 132, 8 96 Z"
          fill="none"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Text
          x={100}
          y={34}
          {...line(kit, name, 'heavy', 0.08, 160, 16)}
          within={boxSpec(14, 14, 172, 26)}
        >
          {name}
        </Text>
        <line x1={8} x2={192} y1={44} y2={44} strokeWidth={1.6} />
        <Art kit={kit} {...art} />
        <Text
          x={100}
          y={148}
          {...line(kit, date, 'heavy', 0.04, 80, 12)}
          within={polygonSpec([
            [30, 134],
            [170, 134],
            [146, 154],
            [54, 154],
          ])}
          outside={artSpec(kit, art.x, art.y, art.size)}
        >
          {date}
        </Text>
      </>
    ),
  }
}

// Deutsche Post's long hexagon: the name along the top, the region along the bottom, the picture
// at the left and the date in a ruled field at the right.
function longHexagon(kit: Kit): Drawn {
  const { design, place } = kit
  const points: Point[] = [
    [8, 100],
    [60, 10],
    [200, 10],
    [252, 100],
    [200, 190],
    [60, 190],
  ]
  const within = polygonSpec(insetPolygon(points, 1.5))
  const name = upper(place.name)
  const sub = regionLine(kit)
  const art = { x: 40, y: 56, size: 88 }
  const field = { x: 142, y: 80, w: 88, h: 44 }
  const date = dateOf(kit)
  const label = upper(design.label)
  const inField = boxSpec(field.x, field.y, field.w, field.h)
  const outside = artSpec(kit, art.x, art.y, art.size)
  return {
    width: 260,
    height: 200,
    body: (
      <>
        <path d={pathOf(points)} fill="none" strokeWidth={3} strokeLinejoin="round" />
        {design.variant && (
          <path
            d={pathOf(insetPolygon(points, 7))}
            fill="none"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        )}
        <Text x={130} y={40} {...line(kit, name, 'heavy', 0.08, 136, 17)} within={within}>
          {name}
        </Text>
        <Art kit={kit} {...art} />
        <line x1={field.x} x2={field.x + field.w} y1={field.y} y2={field.y} strokeWidth={1.6} />
        <line
          x1={field.x}
          x2={field.x + field.w}
          y1={field.y + field.h}
          y2={field.y + field.h}
          strokeWidth={1.6}
        />
        <Text
          x={field.x + field.w / 2}
          y={field.y + 21}
          {...line(kit, date, 'heavy', 0.04, field.w - 10, 16)}
          within={inField}
          outside={outside}
        >
          {date}
        </Text>
        <Text
          x={field.x + field.w / 2}
          y={field.y + 36}
          {...line(kit, label, 'light', 0.2, field.w - 10, 7.5)}
          within={inField}
          outside={outside}
        >
          {label}
        </Text>
        <Text
          x={130}
          y={172}
          {...line(kit, sub, 'mid', 0.14, 120, 11)}
          within={within}
          outside={outside}
        >
          {sub}
        </Text>
      </>
    ),
  }
}

// A seal cut in reverse: a solid disc (or square) of ink with the picture, the name and a ring
// knocked out of it, and the date in ink in a knocked-out pill.
function seal(kit: Kit): Drawn {
  const { id, design, place } = kit
  const [cx, cy] = [110, 110]
  const square = design.variant
  const name = upper(place.name)
  const heights = inkHeights(name)
  // Its ink reaches in no nearer the middle than 70, clear of the date pill's corners.
  const nameSet = line(
    kit,
    name,
    'heavy',
    0.16,
    Math.PI * 0.62 * (80 - (heights.ascent + heights.descent) * 15),
    Math.min(15, 14 / heights.ascent),
  )
  // The name hangs under the bottom; a descender moves it in, clear of the knocked-out ring.
  const radius = 84 - Math.max(0, nameSet.descent - 1.5)
  const pill = { x: 74, y: 146, w: 72, h: 20 }
  const art = { x: 54, y: 26, size: 112 }
  const date = dateOf(kit)
  const dateSet = line(kit, date, 'heavy', 0.06, pill.w - 12, 12)
  const within = square ? boxSpec(22, 22, 176, 176) : ellipseSpec(cx, cy, 89)
  const outside = `${boxSpec(pill.x, pill.y, pill.w, pill.h)};${artSpec(kit, art.x, art.y, art.size)}`
  const nameText = (hidden: boolean) => (
    <ArcText
      path={`${id}-bottom`}
      {...nameSet}
      fill={hidden ? undefined : '#000'}
      hidden={hidden}
      within={hidden ? within : undefined}
      outside={hidden ? outside : undefined}
    >
      {name}
    </ArcText>
  )
  return {
    width: 220,
    height: 220,
    body: (
      <>
        {arcPaths(id, cx, cy, radius, radius)}
        <mask id={`${id}-seal`}>
          {square ? (
            <rect x={10} y={10} width={200} height={200} rx={28} fill="#fff" />
          ) : (
            <circle cx={cx} cy={cy} r={100} fill="#fff" />
          )}
          {square ? (
            <rect
              x={17}
              y={17}
              width={186}
              height={186}
              rx={22}
              fill="none"
              stroke="#000"
              strokeWidth={2}
            />
          ) : (
            <circle cx={cx} cy={cy} r={92} fill="none" stroke="#000" strokeWidth={2} />
          )}
          <g color="#000">
            <Art kit={kit} {...art} />
          </g>
          <rect x={pill.x} y={pill.y} width={pill.w} height={pill.h} rx={10} fill="#000" />
          {nameText(false)}
        </mask>
        <rect width={220} height={220} stroke="none" mask={`url(#${id}-seal)`} />
        {nameText(true)}
        <Text
          x={cx}
          y={centred(dateSet, pill.y + pill.h / 2)}
          {...dateSet}
          within={boxSpec(pill.x, pill.y, pill.w, pill.h)}
        >
          {date}
        </Text>
      </>
    ),
  }
}

// No frame and no wording: the picture alone, with a small date stamp struck over its corner.
function mute(kit: Kit): Drawn {
  const { print } = kit
  const stamp = { cx: 178, cy: 182, r: 30 }
  const within = ellipseSpec(stamp.cx, stamp.cy, stamp.r - 1.5)
  const day = two(print.day)
  const month = monthName(print)
  return {
    width: 220,
    height: 220,
    body: (
      <>
        <Art kit={kit} x={30} y={14} size={152} />
        <circle cx={stamp.cx} cy={stamp.cy} r={stamp.r} fill="none" strokeWidth={2} />
        <Text
          x={stamp.cx}
          y={stamp.cy + 3}
          {...line(kit, day, 'heavy', 0.06, 40, 15)}
          within={within}
        >
          {day}
        </Text>
        <Text
          x={stamp.cx}
          y={stamp.cy + 15}
          {...line(kit, month, 'mid', 0.14, 34, 8)}
          within={within}
        >
          {month}
        </Text>
      </>
    ),
  }
}

export const familyLayouts = {
  fukeiin,
  eki,
  sonderstempel,
  bridge,
  duplex,
  wavy,
  slogan,
  'first-day': firstDay,
  passport,
  shield,
  'long-hexagon': longHexagon,
  seal,
  mute,
} as const satisfies Record<Exclude<Family, 'classic'>, (kit: Kit) => Drawn>
