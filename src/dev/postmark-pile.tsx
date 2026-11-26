import { useEffect, useId, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import { textLinkClass } from '#/lib/text-link'
import { tw } from '#/lib/tw'
import { cn } from '#/lib/utils'

import { Postmark, postmarkSize } from './postmark'
import { ThanksNote, thanksReach } from './postmark-thanks'
import { placeholderOutline } from './postmark-visitor-places'
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
// How dark the foot gets, by scheme: the end stop's opacity.
const darkenClass = tw('[stop-opacity:0.15] dark:[stop-opacity:0.45]')

// The stamps land one by one once the pile is reached and has stayed in view for `wait`
// (src/styles.css): the deepest first and the newest last, over `spread`. Their delays follow a cube of their place
// in the pile, so the buried ones come in a rush and the top ones land singly. The visitor's
// own lands `yours` after the last of them, pressing down for `press` (animate-postmark-press),
// and the note starts writing `note` after that. The pile starts once its top is `reached` of the
// way up the viewport.
const landing = {
  wait: 400,
  spread: 1600,
  curve: 3,
  yours: 260,
  press: 520,
  note: 420,
  reached: 0.25,
}

/** When the stamp `order` places from the bottom lands, of `count`, in ms from the start. */
function landDelay(order: number, count: number) {
  const share = count > 1 ? order / (count - 1) : 1
  return landing.spread * share ** landing.curve
}

/**
 * Whether the pile has been reached and its stamps are landing, and whether they all have:
 * stamps that arrive after that, such as the visitor's own once they're stamped, land at once.
 */
function useLanding(element: HTMLElement | null) {
  const [phase, setPhase] = useState<'waiting' | 'landing' | 'landed'>('waiting')
  // When they started, in the page's clock.
  const [startedAt, setStartedAt] = useState<number>()
  useEffect(() => {
    if (!element) return undefined
    let pending: ReturnType<typeof setTimeout> | undefined
    let done: ReturnType<typeof setTimeout> | undefined
    // The pile starts once it has stayed in view for `wait`: one in view only until the Gallery
    // above it loads and pushes it down doesn't.
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(pending)
        if (!entry?.isIntersecting) return
        pending = setTimeout(() => {
          observer.disconnect()
          setPhase('landing')
          setStartedAt(performance.now())
          // Landed once the visitor's own has finished pressing down and the note has started:
          // ending its delay any sooner would cut its press short.
          done = setTimeout(
            () => setPhase('landed'),
            landing.spread + landing.yours + Math.max(landing.press, landing.note),
          )
        }, landing.wait)
      },
      { rootMargin: `0px 0px -${landing.reached * 100}% 0px` },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      clearTimeout(pending)
      clearTimeout(done)
    }
  }, [element])
  return [phase, startedAt] as const
}

/**
 * The pile's width, and its room: from just under the contents to the viewport's foot, which
 * the page's foot meets once it's scrolled to the end. Without the contents (a narrow
 * viewport), a share of the viewport's height.
 */
function useFrame() {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const [contentsFoot, setContentsFoot] = useState<number>()
  const [viewport, setViewport] = useState(0)
  useEffect(() => {
    const target = element
    if (!target) return undefined
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(target)
    // The room is measured in the small viewport, the one with a phone's toolbars shown, so it
    // holds still as they collapse on the way down to the pile. The contents are fixed to the
    // viewport's middle, so their foot is taken from it the same way.
    const measure = () => {
      const small = smallViewportHeight()
      const contents = document.querySelector('[data-table-of-contents]')
      const box = contents?.getBoundingClientRect()
      setContentsFoot(
        box && box.height > 0 ? box.bottom - window.innerHeight / 2 + small / 2 : undefined,
      )
      setViewport(small)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [element])
  const room =
    contentsFoot === undefined ? viewport * roomShare : viewport - contentsFoot - contentsGap
  return [element, setElement, width, Math.max(1, room)] as const
}

/** The small viewport's height (100svh): the viewport with a phone's toolbars shown. */
function smallViewportHeight() {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;top:0;height:100svh;visibility:hidden;pointer-events:none'
  document.body.append(probe)
  const height = probe.getBoundingClientRect().height
  probe.remove()
  return height || window.innerHeight
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
  const [element, setElement, width, room] = useFrame()
  const [phase, startedAt] = useLanding(width > 0 ? element : null)
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
      pileLayout(
        count,
        width,
        stamp,
        room,
        pinned && keep !== undefined
          ? { index: pinned.index, left: keep, right: keep + thanksReach(stamp) }
          : undefined,
      ),
    [count, width, stamp, room, pinned, keep],
  )
  // The darkening covers the blur's fade, at least the bottom 120 px.
  const fade = Math.max(120, height * fadeShare)
  // Deepest first, so the newest lie on top, and the visitor's own over them all.
  const deepestFirst = spots.filter((spot) => !spot.you).reverse()
  const yours = spots.find((spot) => spot.you)
  // The visitor's own lands after the rest, and the note writes after it.
  const yoursDelay = landing.spread + landing.yours
  const noteDelay = yoursDelay + landing.note
  // Stamps wait, hidden, until the pile is reached; once every one has landed, new ones land at
  // once.
  const landStyle = (delay: number) =>
    // SAFETY: custom properties, which CSSProperties doesn't list.
    ({
      '--land-delay': `${phase === 'landed' ? 0 : delay}ms`,
      '--land-state': phase === 'waiting' ? 'paused' : 'running',
    }) as CSSProperties
  // By index, so the visitor's own, if it is also among the newest, is named once.
  const recent = [...byIndex.values()]
    .filter((record) => record.index >= count - Math.min(5, visitors))
    .sort((a, b) => b.index - a.index)
  // A stamp without a pictorial draws its place's OpenStreetMap outline, whose licence asks for
  // a credit wherever one shows.
  const mapped = spots.some((spot) => {
    const record = byIndex.get(spot.index)
    return (
      record?.deal.pictorial === undefined &&
      !!record?.place.outline &&
      record.place.outline !== placeholderOutline
    )
  })

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
        ref={setElement}
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
              <linearGradient
                id={`${id}-darken`}
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1={height - fade}
                x2="0"
                y2={height}
              >
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" className={darkenClass} />
              </linearGradient>
            </defs>
            {[...deepestFirst, ...(yours ? [yours] : [])].map(({ index, across, down }, order) => {
              const record = byIndex.get(index)
              if (!record) return null
              const pastFoot = down + stamp * 0.72 > height
              const mine = index === yours?.index
              return (
                <g
                  key={index}
                  className={cn(
                    'mix-blend-multiply dark:mix-blend-screen',
                    mine ? 'animate-postmark-press' : 'animate-postmark-land',
                  )}
                  style={landStyle(mine ? yoursDelay : landDelay(order, deepestFirst.length))}
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
                // Once the visitor's own has landed.
                writeFrom={startedAt === undefined ? undefined : startedAt + noteDelay}
              />
            )}
            {/* The darkening holds its depth on past the foot, under the stamps that run on. */}
            <rect
              x={0}
              y={height - fade}
              width={width}
              height={fade + stamp * (pileSettings.runOut + 1)}
              fill={`url(#${id}-darken)`}
            />
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
      {mapped && (
        <p className="absolute bottom-3 left-4 text-xs text-neutral-500 dark:text-neutral-400">
          Map outlines ©{' '}
          <a href="https://www.openstreetmap.org/copyright" className={textLinkClass}>
            OpenStreetMap
          </a>{' '}
          contributors
        </p>
      )}
    </section>
  )
}
