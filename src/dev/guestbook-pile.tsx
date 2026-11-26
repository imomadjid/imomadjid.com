import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

import { pileLayout } from './guestbook-wall'
import type { StampRecord } from './guestbook-wall'
import { Postmark } from './postmark'

// The Guestbook's pile at the foot of the page (guestbook-wall.ts): the newest stamps on top,
// spread out enough that every name shows, the older ones packed tighter as they sink, running
// off the sides and the foot, which darkens a little and goes out of focus under the footer that
// `children` lays over it. Once full, the pile reaches up to just under the page's contents.

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
const footBlur = 8
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

export function GuestbookPile({
  records,
  yours,
  bleed = true,
  className,
  children,
}: {
  // Every stamp so far, oldest first.
  records: readonly StampRecord[]
  // Stamps to mark, as the visitor's own.
  yours?: ReadonlySet<number>
  // Span the viewport's width from inside the page's column, as the homepage's footer does.
  bleed?: boolean
  className?: string
  children?: ReactNode
}) {
  const [element, width, room] = useFrame()
  const stamp = stampSize(width)
  const { spots, height } = useMemo(
    () => pileLayout(records.length, width, stamp, room),
    [records.length, width, stamp, room],
  )
  // The darkening covers the blur's fade, and at least the footer's row.
  const fade = Math.max(120, height * fadeShare)
  // Deepest first, so the newest lie on top.
  const deepestFirst = [...spots].reverse()
  const recent = records.slice(-5).reverse()

  return (
    <section
      aria-label="Guestbook"
      // Full width from inside the page's column; main clips the overhang a scrollbar adds.
      className={cn(bleed ? 'relative ml-[calc(50%-50vw)] w-screen' : 'relative w-full', className)}
    >
      <p className="sr-only">
        {`${records.length.toLocaleString('en')} visitors. Most recently from ${recent
          .map((record) => `${record.place.name}, ${record.place.country}`)
          .join('; ')}.`}
      </p>
      <div
        ref={element}
        aria-hidden="true"
        // Stamps run off the sides and the foot: clipped there, and kept out of the page's size.
        className="relative w-full overflow-clip"
        style={{ height: width > 0 ? height : 0 }}
      >
        {width > 0 &&
          deepestFirst.map(({ index, across, down }) => {
            const record = records[index]
            if (!record) return null
            return (
              <Postmark
                key={index}
                place={record.place}
                visitor={record.ordinal}
                deal={record.deal}
                print={record.print}
                size={stamp}
                className={`absolute mix-blend-multiply dark:mix-blend-screen ${
                  yours?.has(index)
                    ? 'outline-2 outline-offset-4 outline-foreground/50 outline-dashed'
                    : ''
                }`}
                style={{ left: `${across * 100}%`, top: down, translate: '-50% -50%' }}
              />
            )
          })}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: fade,
            backdropFilter: `blur(${footBlur}px)`,
            WebkitBackdropFilter: `blur(${footBlur}px)`,
            maskImage: blurMask,
          }}
        />
        {(['light', 'dark'] as const).map((scheme) => (
          <div
            key={scheme}
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0',
              scheme === 'light' ? 'dark:hidden' : 'hidden dark:block',
            )}
            style={{
              height: fade,
              backgroundImage: `linear-gradient(to bottom, transparent, rgb(0 0 0 / ${
                darken[scheme]
              }))`,
            }}
          />
        ))}
      </div>
      {children && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-6">
          <div className="w-full max-w-[34rem]">{children}</div>
        </div>
      )}
    </section>
  )
}
