import { useId } from 'react'
import type { CSSProperties } from 'react'

import { dealPostmark, drawFamily } from './postmark-deal'
import type { Deal } from './postmark-deal'
import { dates, familyNames, inkOf, subjectOf, visitorPrint } from './postmark-kit'
import type { Family, Kit, PostmarkPlace, Print, Style } from './postmark-kit'

// A passport-style postmark for a visitor's place, dealt by postmark-deal.ts: the place's house
// ink and the next family and pictorial from its shuffle bags, with the visitor's own lettering,
// date format, ornaments, border and design details; the print (date, angle, serial, how the ink
// took) is the visitor's too. The families are in postmark-families.tsx and
// postmark-classic.tsx.

export type { PostmarkPlace } from './postmark-kit'

// Every family is drawn to the same scale: `size` is how wide a 220-unit round stamp shows, so a
// wide machine cancel comes out wider, not smaller.
export function Postmark({
  place,
  visitor,
  salt = 0,
  size = 180,
  family: familyOverride,
  choices,
  outline = false,
  deal: stored,
  print: printed,
  at,
  className,
  style,
}: {
  place: PostmarkPlace
  // The visitor's place among the place's visitors, 0 for the first.
  visitor: number
  salt?: number
  size?: number
  // Show this family instead of the one dealt.
  family?: Family
  // Style choices in place of the dealt ones, where the family accepts them.
  choices?: Partial<Style>
  // Draw the map outline even where the place has a pictorial.
  outline?: boolean
  // A stamp saved when its visitor arrived: drawn as saved, not dealt again, so drawings added
  // later don't change it.
  deal?: Deal
  print?: Print
  // Draw it inside an SVG, centred on this point and turned there, rather than as an HTML
  // element: what an SVG draws past its own box is painted without taking up room, so stamps can
  // hang off the end of the page without lengthening it.
  at?: { x: number; y: number }
  className?: string
  style?: CSSProperties
}) {
  const id = useId().replaceAll(':', '')
  const deal = stored ?? dealPostmark(place, visitor, salt, { family: familyOverride, choices })
  const { design, family, pictorial } = deal
  const print = printed ?? visitorPrint(place.key, visitor)
  const looks = deal.style
  const ink = inkOf(looks.ink)
  const kit: Kit = { id, place, design, print, style: looks, pictorial, outline }
  const { width, height, body } = drawFamily(family, kit)
  const scale = size / 220
  // Speckle about a pixel and a half across at any size: finer, it only greys the ink.
  const speckle = Math.min(0.85, 0.55 * scale * 2)

  const inkClass = `text-[var(--ink)] data-clash:outline-2 data-clash:outline-offset-4 data-clash:outline-red-500 data-clash:outline-dashed dark:text-[var(--ink-dark)] ${className ?? ''}`
  const inkStyle =
    // SAFETY: CSSProperties has no index signature for custom properties; --ink and --ink-dark
    // are plain colour strings.
    { '--ink': ink.light, '--ink-dark': ink.dark, ...style } as CSSProperties

  const stamp = (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      x={at ? (-width * scale) / 2 : undefined}
      y={at ? (-height * scale) / 2 : undefined}
      data-postmark={`${place.name} (${family === 'classic' ? design.shape : familyNames[family]}; ${Object.values(looks).join(', ')})`}
      className={at ? 'overflow-visible' : `overflow-visible ${inkClass}`}
      style={at ? undefined : { ...inkStyle, rotate: `${print.rotation.toFixed(1)}deg` }}
    >
      <title>{`Postmark: ${place.name}, ${place.country}, ${dates.long(print)}, with ${subjectOf(kit)}`}</title>
      <defs>
        {/* Rubber on paper: fine speckle where the ink didn't take, uneven pressure across the
            stamp, and a slight wobble at the edges. */}
        <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={speckle.toFixed(3)}
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
        {body}
      </g>
    </svg>
  )
  if (!at) return stamp
  return (
    <g
      transform={`translate(${at.x} ${at.y}) rotate(${print.rotation.toFixed(1)})`}
      className={inkClass}
      style={inkStyle}
    >
      {stamp}
    </g>
  )
}
