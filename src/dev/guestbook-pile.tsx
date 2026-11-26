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

// The foot of the pile blurs by blurring each stamp, by how far into the fade its centre lies,
// rather than with backdrop-filter. The stamps don't move, so a stamp's filter is painted once
// into the page's tiles, and scrolling or the Sunlit light's frames cost nothing more. A
// backdrop-filter is the compositor's to run, every frame the light changes, across the whole
// width of the fade; it suits a backdrop that moves, which this one doesn't. Stamps lie at every
// depth, so the blur still deepens smoothly down the pile.
function stampBlur(
  down: number,
  height: number,
  fade: number,
  settings: PileSettings,
  stamp: number,
) {
  const into = Math.min(1, Math.max(0, (down - (height - fade)) / fade))
  // Eased in, so the top of the fade stays nearly sharp and the foot goes soft.
  const radius = settings.blur * (stamp / 124) * into * into
  return radius < 0.25 ? undefined : `blur(${radius.toFixed(2)}px)`
}

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
                style={{
                  left: `${across * 100}%`,
                  top: down,
                  translate: '-50% -50%',
                  filter: stampBlur(down, height, fade, settings, stamp),
                }}
              />
            )
          })}
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
