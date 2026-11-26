import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { cn } from '#/lib/utils'

import { Postmark, postmarkSize } from './postmark'
import { ThanksNote, thanksReach } from './postmark-thanks'
import { pileLayout, pileSettings } from './postmark-visits'
import type { StampRecord } from './postmark-visits'

// The postmark footer's pile at the foot of the page (postmark-visits.ts): the newest stamps on
// top, spread out enough that every name shows, the older ones packed tighter as they sink,
// running off the sides and the foot, which darkens a little and goes out of focus. Once full,
// the pile reaches up to just under the page's contents.

// How wide a round postmark shows: a phone's pile is narrower, so its stamps are smaller.
function stampSize(width: number) {
  return width < 640 ? 84 : 124
}

// The pile's top lies this far under the contents once it fills its room, or, where the contents
// are hidden, it takes this share of the viewport's height.
const contentsGap = 24
const roomShare = 0.5

// The foot of the pile goes out of focus and darkens a little over this share of its height.
// The blur is skiper41's: one backdrop blur across the whole width, masked to full strength over
// the lower half of the fade and fading out above it.
const fadeShare = 0.6
const footBlur = 2
const blurMask = 'linear-gradient(to top, black 50%, transparent)'
const darken = { light: 0.15, dark: 0.45 }

/**
 * The pile's width, and its room: from just under the contents to the viewport's foot, which
 * the page's foot meets once it's scrolled to the end. Without the contents (a narrow
 * viewport), a share of the viewport's height.
 */
function useFrame() {
  const element = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [contentsFoot, setContentsFoot] = useState<number>()
  const [viewport, setViewport] = useState(0)
  useEffect(() => {
    const target = element.current
    if (!target) return undefined
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(target)
    // The contents are fixed to the viewport, so their foot moves only as the viewport resizes.
    const measure = () => {
      const contents = document.querySelector('nav[aria-label="On this page"]')
      const box = contents?.getBoundingClientRect()
      setContentsFoot(box && box.height > 0 ? box.bottom : undefined)
      setViewport(window.innerHeight)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  const room =
    contentsFoot === undefined ? viewport * roomShare : viewport - contentsFoot - contentsGap
  return [element, width, Math.max(1, room)] as const
}

export function PostmarkPile({
  records,
  count = records.length,
  visitors = count,
  you,
  bleed = true,
  className,
}: {
  // The stamps the pile can show, each at its `index`: every one so far, or the newest of them
  // and the visitor's own.
  records: readonly StampRecord[]
  // How many stamps there are, the newest at `count - 1`.
  count?: number
  // How many of them are real visitors', for screen readers: the newest are.
  visitors?: number
  // The visitor's own stamp, by its index: it lies at the top in the middle, with "thanks for
  // visiting!" written beside it, however long ago they first came.
  you?: number
  // Span the viewport's width from inside the page's column, as the homepage's does.
  bleed?: boolean
  className?: string
}) {
  const id = useId().replace(/[^\w-]/g, '')
  const [element, width, room] = useFrame()
  const stamp = stampSize(width)
  const byIndex = useMemo(() => new Map(records.map((record) => [record.index, record])), [records])
  const pinned = you === undefined ? undefined : byIndex.get(you)
  // The visitor's own stamp's size, which its note starts past.
  const yourSize = useMemo(
    () => pinned && postmarkSize(pinned.place, pinned.deal, pinned.print, stamp),
    [pinned, stamp],
  )
  // Other stamps' centres keep about half a stamp clear of the visitor's own and its note.
  const keep = yourSize && yourSize.width / 2 + stamp * 0.45
  const { spots, height } = useMemo(
    () =>
      pinned && keep !== undefined
        ? pileLayout(count, width, stamp, room, {
            index: pinned.index,
            left: keep,
            right: keep + thanksReach(stamp),
          })
        : pileLayout(count, width, stamp, room),
    [count, width, stamp, room, pinned, keep],
  )
  // The darkening covers the blur's fade, at least the bottom 120 px.
  const fade = Math.max(120, height * fadeShare)
  // Deepest first, so the newest lie on top, and the visitor's own over them all.
  const deepestFirst = spots.filter((spot) => !spot.you).reverse()
  const yours = spots.find((spot) => spot.you)
  const recent = records
    .filter((record) => record.index >= count - Math.min(5, visitors))
    .sort((a, b) => b.index - a.index)

  return (
    <section
      aria-label="Visitors' postmarks"
      // Full width from inside the page's column; main clips the overhang a scrollbar adds.
      className={cn(bleed ? 'relative ml-[calc(50%-50vw)] w-screen' : 'relative w-full', className)}
    >
      <p className="sr-only">
        {visitors === 0
          ? 'No visitors yet.'
          : `${visitors.toLocaleString('en')} ${visitors === 1 ? 'visitor' : 'visitors'}. Most recently from ${recent
              .map((record) => `${record.place.name}, ${record.place.country}`)
              .join('; ')}.`}
      </p>
      <div
        ref={element}
        aria-hidden="true"
        // Cut at the sides. The stamps run on past the foot, drawn as SVG past its box, which is
        // painted without taking up room, as the blind wand reaches past the top of the page:
        // the page ends at the pile's foot, and a scroll that bounces past it still finds stamps.
        className="relative w-full overflow-x-clip"
        style={{ height: width > 0 ? height : 0 }}
      >
        {width > 0 && (
          <svg width={width} height={height} className="absolute inset-0 overflow-visible">
            <defs>
              {/* Past the foot, out of the backdrop blur's reach, a stamp softens on its own. */}
              <filter id={`${id}-soft`}>
                <feGaussianBlur stdDeviation={footBlur} />
              </filter>
              {(['light', 'dark'] as const).map((scheme) => (
                <linearGradient
                  key={scheme}
                  id={`${id}-${scheme}`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1={height - fade}
                  x2="0"
                  y2={height}
                >
                  <stop offset="0" stopColor="#000" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity={darken[scheme]} />
                </linearGradient>
              ))}
            </defs>
            {[...deepestFirst, ...(yours ? [yours] : [])].map(({ index, across, down }) => {
              const record = byIndex.get(index)
              if (!record) return null
              const pastFoot = down + stamp * 0.72 > height
              return (
                <g
                  key={index}
                  className="mix-blend-multiply dark:mix-blend-screen"
                  filter={pastFoot ? `url(#${id}-soft)` : undefined}
                >
                  <Postmark
                    place={record.place}
                    visitor={record.ordinal}
                    deal={record.deal}
                    print={record.print}
                    size={stamp}
                    at={{ x: across * width, y: down }}
                  />
                </g>
              )
            })}
            {yours && pinned && yourSize && (
              <ThanksNote
                x={yours.across * width}
                y={yours.down}
                width={yourSize.width}
                height={yourSize.height}
                rotation={pinned.print.rotation}
                stamp={stamp}
              />
            )}
            {/* The darkening holds its depth on past the foot, under the stamps that run on. */}
            {(['light', 'dark'] as const).map((scheme) => (
              <rect
                key={scheme}
                x={0}
                y={height - fade}
                width={width}
                height={fade + stamp * (pileSettings.runOut + 1)}
                fill={`url(#${id}-${scheme})`}
                className={scheme === 'light' ? 'dark:hidden' : 'hidden dark:block'}
              />
            ))}
          </svg>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: fade,
            backdropFilter: `blur(${footBlur}px)`,
            WebkitBackdropFilter: `blur(${footBlur}px)`,
            maskImage: blurMask,
          }}
        />
      </div>
    </section>
  )
}
