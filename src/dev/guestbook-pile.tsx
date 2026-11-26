import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

import { pileLayout, pileSettings } from './guestbook-wall'
import type { PileSettings, StampRecord } from './guestbook-wall'
import { Postmark } from './postmark'

// The Guestbook's pile at the foot of the page (guestbook-wall.ts): the newest stamps on top,
// spread out enough that every name shows, the older ones packed tighter as they sink, and the
// bottom of the pile darkening a little and blurring softly into the footer, which `children`
// lays over it.

// How wide a round postmark shows: a phone's pile is narrower, so its stamps are a little smaller.
function stampSize(width: number) {
  return width < 640 ? 84 : 124
}

// Each layer blurs what's behind it, the ones before included, so together they reach about
// 4.6 px at the foot: slight, as a shallow depth of field would.
const blurSteps = [0.5, 1, 2, 4] as const

function useWidth() {
  const element = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const target = element.current
    if (!target) return undefined
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])
  return [element, width] as const
}

export function GuestbookPile({
  records,
  settings = pileSettings,
  yours,
  bleed = true,
  className,
  children,
}: {
  // Every stamp so far, oldest first.
  records: readonly StampRecord[]
  settings?: PileSettings
  // Stamps to mark, as the visitor's own.
  yours?: ReadonlySet<number>
  // Span the viewport's width from inside the page's column, as the homepage's footer does.
  bleed?: boolean
  className?: string
  children?: ReactNode
}) {
  const [element, width] = useWidth()
  const stamp = stampSize(width)
  const { spots, height } = useMemo(
    () => pileLayout(records.length, width, stamp, settings),
    [records.length, width, stamp, settings],
  )
  // The darkening and blur cover the pile's lower part, and at least the footer's row.
  const fade = Math.max(160, Math.min(height * 0.55, 380))
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
        className="relative w-full [clip-path:inset(-50vh_0_0_0)]"
        style={{ height: width > 0 ? height : 0 }}
      >
        {width > 0 &&
          [...spots].reverse().map(({ index, across, down }) => {
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
        {blurSteps.map((blur, step) => (
          <div
            key={blur}
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: fade,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: `linear-gradient(to bottom, transparent ${step * 22}%, black ${step * 22 + 34}%)`,
            }}
          />
        ))}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-black/15 dark:to-black/45"
          style={{ height: fade }}
        />
      </div>
      {children && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-6">
          <div className="w-full max-w-[34rem]">{children}</div>
        </div>
      )}
    </section>
  )
}
