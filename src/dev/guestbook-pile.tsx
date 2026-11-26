import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

import { pileLayout, pileSettings } from './guestbook-wall'
import type { PileSettings, StampRecord } from './guestbook-wall'
import { Postmark } from './postmark'

// The Guestbook's pile at the foot of the page (guestbook-wall.ts): the newest stamps on top,
// spread out enough that every name shows, the older ones packed tighter as they sink, running
// off the sides and the foot, which darkens a little and goes out of focus under the footer that
// `children` lays over it. Once full, the pile reaches up to just under the page's contents.

// The foot of the pile blurs by blurring each stamp, by how far into the fade its centre lies,
// rather than with backdrop-filter. The stamps don't move, so a stamp's filter is painted once
// into the page's tiles, and scrolling or the Sunlit light's frames cost nothing more. A
// backdrop-filter is the compositor's to run, every frame the light changes, across the whole
// width of the fade; it suits a backdrop that moves, which this one doesn't. Stamps lie at every
// depth, so the blur still deepens smoothly down the pile.
function stampBlur(into: number, settings: PileSettings, stamp: number) {
  const radius = settings.foot.blur * (stamp / 124) * into ** settings.foot.blurCurve
  return radius < 0.25 ? undefined : `blur(${radius.toFixed(2)}px)`
}

/**
 * The pile's width, and its room: from just under the contents to the viewport's foot, which
 * the page's foot meets once it's scrolled to the end. Without the contents (a narrow
 * viewport), a share of the viewport's height.
 */
function useFrame(settings: PileSettings) {
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
    contentsFoot === undefined
      ? viewport * settings.extent.room
      : viewport - contentsFoot - settings.extent.gap
  return [element, width, Math.max(1, room)] as const
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
  const [element, width, room] = useFrame(settings)
  const stamp = width < 640 ? settings.stamp.phone : settings.stamp.desktop
  const { spots, height } = useMemo(
    () => pileLayout(records.length, width, stamp, room, settings),
    [records.length, width, stamp, room, settings],
  )
  // The darkening and blur cover the pile's lower part, and at least the footer's row.
  const fade = Math.max(120, height * settings.foot.fade)
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
          [...spots].reverse().map(({ index, across, down }) => {
            const record = records[index]
            if (!record) return null
            const into = Math.min(1, Math.max(0, (down - (height - fade)) / fade))
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
                  filter: stampBlur(into, settings, stamp),
                }}
              />
            )
          })}
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
                scheme === 'light' ? settings.foot.darken : settings.foot.darkenDark
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
