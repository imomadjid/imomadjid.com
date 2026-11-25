import type { ReactNode } from 'react'

import {
  arcPaths,
  ArcText,
  Art,
  artInk,
  artSpec,
  boxSpec,
  capHeight,
  dates,
  ellipseSpec,
  fit,
  insetPolygon,
  monthName,
  pathOf,
  polygonSpec,
  rimLettering,
  Star,
  Text,
  textUnits,
} from './postmark-kit'
import type { Family, Kit, Point } from './postmark-kit'

// Postmark layout families after real postmarks, as the design research describes them (sizes
// from Japan Post's scenic postmarks, Deutsche Post's special-handstamp rules, USPS pictorial
// postmarks and Schengen passport stamps, thickened for a screen). Each returns its viewBox and
// what it draws; round ones use a 220 box centred on (110, 110), as the classic stamps do.

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

// Japan's scenic postmark: the picture is the stamp, with the date in a pill and the office's
// name along the bottom.
function fukeiin(kit: Kit): Drawn {
  const { id, design, print, place } = kit
  const [cx, cy] = [110, 110]
  const reach = 100 - 1.3
  const name = upper(place.name)
  const date = dates.dots(print)
  const radius = 94
  const size = Math.min(13, (Math.PI * 0.8 * (radius - capHeight * 13)) / textUnits(name, 0.22))
  // The dots stand just past each end of the name.
  const half = (textUnits(name, 0.22) * size) / (radius - capHeight * size) / 2 + 0.16
  const dot = (side: number): Point => [
    cx + side * Math.sin(half) * (radius - 4),
    cy + Math.cos(half) * (radius - 4),
  ]
  const pill = { x: 72, y: 148, w: 76, h: 20 }
  const art = { x: 52, y: 20, size: 116 }
  const dateSize = fit(date, pill.w - 18, 13, 0.06)
  return {
    width: 220,
    height: 220,
    body: (
      <>
        <circle cx={cx} cy={cy} r={100} fill="none" strokeWidth={2.6} />
        {design.variant && (
          <line x1={cx - 93.5} x2={cx + 93.5} y1={141} y2={141} strokeWidth={2.2} />
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
          y={pill.y + pill.h / 2 + (capHeight * dateSize) / 2}
          size={dateSize}
          weight={800}
          within={boxSpec(pill.x, pill.y, pill.w, pill.h)}
        >
          {date}
        </Text>
        {arcPaths(id, cx, cy, radius, radius)}
        <ArcText
          path={`${id}-bottom`}
          size={size}
          weight={700}
          spacing={0.22}
          within={ellipseSpec(cx, cy, reach)}
          outside={`${boxSpec(pill.x, pill.y, pill.w, pill.h)};${artSpec(kit, art.x, art.y, art.size)}`}
        >
          {name}
        </ArcText>
        {[-1, 1].map((side) => {
          const [x, y] = dot(side)
          return <circle key={side} cx={x} cy={y} r={2.6} stroke="none" />
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
  const nameSize = fit(name, banner.w - 16, 22, 0.06)
  const subSize = fit(sub, banner.w - 24, 8, 0.2)
  const seal = { cx: 34, cy: 34, r: 18 }
  const art = { x: 56, y: 24, size: 118 }
  const within = boxSpec(banner.x, banner.y, banner.w, banner.h)
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
        <Text
          x={seal.cx}
          y={seal.cy + 2}
          size={13}
          weight={800}
          within={ellipseSpec(seal.cx, seal.cy, seal.r - 1)}
        >
          {String(print.day).padStart(2, '0')}
        </Text>
        <Text
          x={seal.cx}
          y={seal.cy + 11}
          size={6.5}
          weight={700}
          spacing={0.12}
          within={ellipseSpec(seal.cx, seal.cy, seal.r - 1)}
        >
          {monthName(print)}
        </Text>
        <Text x={110} y={186} size={nameSize} weight={800} within={within}>
          {name}
        </Text>
        <Text x={110} y={200} size={subSize} weight={600} spacing={0.2} within={within}>
          {sub}
        </Text>
      </>
    ),
  }
}

// Deutsche Post's special handstamp: the name replaces the top of the border, the region the
// bottom; the picture sits above a ruled date field.
function sonderstempel(kit: Kit): Drawn {
  const { id, design, print, place } = kit
  const [cx, cy] = [110, 110]
  const name = upper(place.name)
  const sub = regionLine(kit)
  // The name's band straddles the border's circle.
  const nameSize = Math.min(16, (Math.PI * 0.72 * 94) / textUnits(name, 0.1))
  const baseline = 100 - (capHeight * nameSize) / 2
  const nameHalf = (textUnits(name, 0.1) * nameSize) / baseline / 2
  // The border breaks a word space past each end of the name, where a star stands.
  const breakAngle = nameHalf + 0.17
  const starAngle = nameHalf + 0.09
  const subSize = fit(sub, 84, 12, 0.1)
  const bottomHalf = Math.asin(Math.min(0.95, (textUnits(sub, 0.1) * subSize) / 2 / 100 + 0.12))
  const top = -Math.PI / 2
  const bottomMid = Math.PI / 2
  const arc = (from: number, to: number) => {
    const [x1, y1] = [cx + 100 * Math.cos(from), cy + 100 * Math.sin(from)]
    const [x2, y2] = [cx + 100 * Math.cos(to), cy + 100 * Math.sin(to)]
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A100 100 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
  }
  const field = { x: 62, y: 130, w: 96, h: 30 }
  const date = dates.fullDots(print)
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
          size={nameSize}
          weight={800}
          spacing={0.1}
          within={outer}
          outside={artSpec(kit, art.x, art.y, art.size)}
        >
          {name}
        </ArcText>
        {[-1, 1].map((side) => {
          // Where the posthorns stand on a German stamp: stars, or plain dots.
          const [x, y] = [cx + side * Math.sin(starAngle) * 100, cy - Math.cos(starAngle) * 100]
          return design.variant ? (
            <circle key={side} cx={x} cy={y} r={3} stroke="none" />
          ) : (
            <Star key={side} x={x} y={y} r={4.5} />
          )
        })}
        <Text
          x={cx}
          y={196 + (capHeight * subSize) / 2}
          size={subSize}
          weight={700}
          spacing={0.1}
          within={outer}
        >
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
          y={field.y + 20}
          size={fit(date, field.w - 10, 14, 0.02)}
          weight={800}
          spacing={0.02}
          within={boxSpec(field.x, field.y, field.w, field.h)}
        >
          {date}
        </Text>
        <Text x={cx} y={176} size={7.5} weight={600} spacing={0.2} within={ellipseSpec(cx, cy, 98)}>
          {`NO.${print.serial}`}
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
  const name = upper(place.name)
  const bottom = countryLine(kit)
  const rim = rimLettering({ reach: 98.5, ring: 62.8, name, bottom, span: 0.62 * Math.PI })
  const date = dates.long(print)
  const chord = (y: number) => Math.sqrt(100 ** 2 - (y - cy) ** 2) - 1.5
  const ring = ellipseSpec(cx, cy, 63.5)
  const art = { x: 86, y: 47, size: 48 }
  return {
    width: 220,
    height: 220,
    body: (
      <>
        <circle cx={cx} cy={cy} r={100} fill="none" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={62} fill="none" strokeWidth={1.6} />
        {[98, 124].map((y) => (
          <line key={y} x1={cx - chord(y)} x2={cx + chord(y)} y1={y} y2={y} strokeWidth={1.8} />
        ))}
        <Text
          x={cx}
          y={117}
          size={fit(date, 112, 15, 0.06)}
          weight={800}
          within={boxSpec(50, 99, 120, 24)}
        >
          {date}
        </Text>
        {arcPaths(id, cx, cy, rim.topRadius, rim.bottomRadius)}
        <ArcText
          path={`${id}-top`}
          size={rim.nameSize}
          weight={800}
          spacing={0.08}
          within={ellipseSpec(cx, cy, 98.5)}
          outside={ring}
        >
          {name}
        </ArcText>
        <ArcText
          path={`${id}-bottom`}
          size={rim.bottomSize}
          weight={600}
          spacing={0.16}
          within={ellipseSpec(cx, cy, 98.5)}
          outside={ring}
        >
          {bottom}
        </ArcText>
        <Star x={26} y={111} r={5} />
        <Star x={194} y={111} r={5} />
        <Art kit={kit} {...art} />
        <Text x={cx} y={146} size={8} weight={600} spacing={0.2} within={ellipseSpec(cx, cy, 60)}>
          {`NO.${print.serial}`}
        </Text>
      </>
    ),
  }
}

// A date stamp beside a barred oval, the obliterator, here with a window for the picture.
function duplex(kit: Kit): Drawn {
  const { id, print, place } = kit
  const [cx, cy] = [85, 85]
  const name = upper(place.name)
  const bottom = countryLine(kit)
  const rim = rimLettering({
    reach: 70.7,
    ring: 40.8,
    name,
    bottom,
    span: 0.72 * Math.PI,
    nameMax: 15,
    bottomMax: 10,
  })
  const date = dates.short(print)
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
  return {
    width: 330,
    height: 170,
    body: (
      <>
        <circle cx={cx} cy={cy} r={72} fill="none" strokeWidth={2.6} />
        <circle cx={cx} cy={cy} r={40} fill="none" strokeWidth={1.6} />
        {[72, 98].map((y) => (
          <line key={y} x1={cx - half(y)} x2={cx + half(y)} y1={y} y2={y} strokeWidth={1.6} />
        ))}
        <Text
          x={cx}
          y={90}
          size={fit(date, 60, 14, 0.06)}
          weight={800}
          within={boxSpec(cx - half(72), 72.8, half(72) * 2, 24.4)}
        >
          {date}
        </Text>
        {arcPaths(id, cx, cy, rim.topRadius, rim.bottomRadius)}
        <ArcText
          path={`${id}-top`}
          size={rim.nameSize}
          weight={800}
          spacing={0.08}
          within={ellipseSpec(cx, cy, 70.7)}
          outside={ellipseSpec(cx, cy, 41.5)}
        >
          {name}
        </ArcText>
        <ArcText
          path={`${id}-bottom`}
          size={rim.bottomSize}
          weight={600}
          spacing={0.16}
          within={ellipseSpec(cx, cy, 70.7)}
          outside={ellipseSpec(cx, cy, 41.5)}
        >
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
  const { id, print, place } = kit
  const name = upper(place.name)
  const bottom = countryLine(kit)
  const date = dates.short(print)
  const dateSize = fit(date, 56, 12, 0.06)
  const rim = rimLettering({
    reach: 56.7,
    ring: 36,
    name,
    bottom,
    span: 0.78 * Math.PI,
    nameMax: 13,
    bottomMax: 9,
  })
  const inner = ellipseSpec(cx, cy, 36)
  return (
    <>
      <circle cx={cx} cy={cy} r={58} fill="none" strokeWidth={2.6} />
      <Text x={cx} y={cy + (capHeight * dateSize) / 2} size={dateSize} weight={800} within={inner}>
        {date}
      </Text>
      {arcPaths(id, cx, cy, rim.topRadius, rim.bottomRadius)}
      <ArcText
        path={`${id}-top`}
        size={rim.nameSize}
        weight={800}
        spacing={0.08}
        within={ellipseSpec(cx, cy, 56.7)}
        outside={inner}
      >
        {name}
      </ArcText>
      <ArcText
        path={`${id}-bottom`}
        size={rim.bottomSize}
        weight={600}
        spacing={0.16}
        within={ellipseSpec(cx, cy, 56.7)}
        outside={inner}
      >
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
          size={fit(hello, column.w, 9, 0.2)}
          weight={700}
          spacing={0.2}
          within={within}
          outside={outside}
        >
          {hello}
        </Text>
        <Text
          x={column.cx}
          y={84}
          size={fit(name, column.w, 20, 0.04)}
          weight={800}
          spacing={0.04}
          within={within}
          outside={outside}
        >
          {name}
        </Text>
        <line x1={column.cx - 40} x2={column.cx + 40} y1={95} y2={95} strokeWidth={1.4} />
        <Text
          x={column.cx}
          y={112}
          size={fit(label, column.w, 7.5, 0.16)}
          weight={600}
          spacing={0.16}
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
  const { design, print, place } = kit
  const art = { x: 10, y: 20, size: 110 }
  const column = { cx: 201, w: 128 }
  const label = upper(design.label)
  const date = dates.us(print)
  const where = `${upper(place.name)}, ${regionLine(kit)}`
  const country = upper(place.country)
  const within = design.variant ? boxSpec(6, 6, 268, 138) : boxSpec(2, 2, 276, 146)
  const outside = artSpec(kit, art.x, art.y, art.size)
  const dateSize = fit(date, column.w, 22, 0.04)
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
          size={fit(label, column.w, 9, 0.24)}
          weight={700}
          spacing={0.24}
          within={within}
          outside={outside}
        >
          {label}
        </Text>
        <line x1={140} x2={262} y1={56} y2={56} strokeWidth={1.6} />
        <Text
          x={column.cx}
          y={84}
          size={dateSize}
          weight={800}
          spacing={0.04}
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
          size={fit(where, column.w, 11, 0.06)}
          weight={700}
          within={within}
          outside={outside}
        >
          {where}
        </Text>
        <Text
          x={column.cx}
          y={132}
          size={fit(country, column.w, 9, 0.16)}
          weight={600}
          spacing={0.16}
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
  const date = dates.long(print)
  const label = `${departure ? 'DEPARTED' : 'ARRIVED'} · ${upper(place.name)}`
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
        <Text
          x={41}
          y={30 + (capHeight * 18) / 2}
          size={18}
          weight={800}
          within={boxSpec(18, 16, 46, 28)}
        >
          {place.countryCode}
        </Text>
        <path d={arrow} stroke="none" />
        <Text x={134} y={34} size={9} weight={600} spacing={0.16} within={within} outside={outside}>
          {`NO.${print.serial}`}
        </Text>
        <Art kit={kit} {...art} />
        <line x1={6} x2={234} y1={56} y2={56} strokeWidth={1.6} />
        <Text
          x={120}
          y={98 + (capHeight * 24) / 2 - 4}
          size={fit(date, 200, 26, 0.04)}
          weight={800}
          spacing={0.04}
          within={within}
        >
          {date}
        </Text>
        <Text
          x={120}
          y={128}
          size={fit(label, 196, 12, 0.16)}
          weight={700}
          spacing={0.16}
          within={within}
        >
          {label}
        </Text>
      </>
    ),
  }
}

// A shield, one of Deutsche Post's special-handstamp outlines.
function shield(kit: Kit): Drawn {
  const { print, place } = kit
  const name = upper(place.name)
  const art = { x: 58, y: 50, size: 82 }
  const date = dates.fullDots(print)
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
          size={fit(name, 160, 16, 0.08)}
          weight={800}
          spacing={0.08}
          within={boxSpec(14, 14, 172, 26)}
        >
          {name}
        </Text>
        <line x1={8} x2={192} y1={44} y2={44} strokeWidth={1.6} />
        <Art kit={kit} {...art} />
        <Text
          x={100}
          y={148}
          size={fit(date, 80, 12, 0.04)}
          weight={800}
          spacing={0.04}
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
  const { design, print, place } = kit
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
  const date = dates.dots(print)
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
        <Text
          x={130}
          y={40}
          size={fit(name, 136, 17, 0.08)}
          weight={800}
          spacing={0.08}
          within={within}
        >
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
          size={fit(date, field.w - 10, 16, 0.04)}
          weight={800}
          spacing={0.04}
          within={boxSpec(field.x, field.y, field.w, field.h)}
          outside={outside}
        >
          {date}
        </Text>
        <Text
          x={field.x + field.w / 2}
          y={field.y + 36}
          size={7.5}
          weight={600}
          spacing={0.2}
          within={boxSpec(field.x, field.y, field.w, field.h)}
          outside={outside}
        >
          {upper(design.label)}
        </Text>
        <Text
          x={130}
          y={172}
          size={fit(sub, 120, 11, 0.14)}
          weight={700}
          spacing={0.14}
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
  const { id, design, print, place } = kit
  const [cx, cy] = [110, 110]
  const square = design.variant
  const name = upper(place.name)
  const radius = 84
  const nameSize = Math.min(
    15,
    (Math.PI * 0.62 * (radius - capHeight * 15)) / textUnits(name, 0.16),
  )
  const pill = { x: 74, y: 146, w: 72, h: 20 }
  const art = { x: 54, y: 26, size: 112 }
  const date = dates.dots(print)
  const dateSize = fit(date, pill.w - 12, 12, 0.06)
  const within = square ? boxSpec(22, 22, 176, 176) : ellipseSpec(cx, cy, 89)
  const outside = `${boxSpec(pill.x, pill.y, pill.w, pill.h)};${artSpec(kit, art.x, art.y, art.size)}`
  const nameText = (hidden: boolean) => (
    <ArcText
      path={`${id}-bottom`}
      size={nameSize}
      weight={800}
      spacing={0.16}
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
          y={pill.y + pill.h / 2 + (capHeight * dateSize) / 2}
          size={dateSize}
          weight={800}
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
  return {
    width: 220,
    height: 220,
    body: (
      <>
        <Art kit={kit} x={30} y={14} size={152} />
        <circle cx={stamp.cx} cy={stamp.cy} r={stamp.r} fill="none" strokeWidth={2} />
        <Text x={stamp.cx} y={stamp.cy + 3} size={15} weight={800} within={within}>
          {String(print.day).padStart(2, '0')}
        </Text>
        <Text x={stamp.cx} y={stamp.cy + 15} size={8} weight={700} spacing={0.14} within={within}>
          {monthName(print)}
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
