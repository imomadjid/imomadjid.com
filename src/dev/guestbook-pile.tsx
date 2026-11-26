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

// The foot of the pile goes out of focus over this share of its height, its blur growing evenly
// from nothing to `footBlur` px at the foot (on a 124 px stamp), and darkens a little.
const fadeShare = 0.6
const footBlur = 14
const darken = { light: 0.15, dark: 0.45 }

// The blur is cut into bands across the fade, each a copy of just the stamps it crosses, blurred
// a step more than the band above and masked to its own strip. Steps of about 1 px don't show,
// and the stamps don't move, so the browser paints the bands once: unlike a backdrop-filter,
// which the compositor runs again every frame the Sunlit light changes, and which only sees what
// lies under it in the same backdrop root. The masks are hard gradient stops, not clip-paths: a
// gradient is sampled at each pixel's centre, so every row falls in exactly one band, where a
// clip's antialiased edge between pixels leaves a faint line at each seam.
const bandCount = 12

type Band = { top: number; bottom: number; blur: number }

function blurBands(height: number, stamp: number): Band[] {
  const fade = Math.max(120, height * fadeShare)
  const start = height - fade
  const strongest = footBlur * (stamp / 124)
  const step = fade / bandCount
  const sharp = { top: Number.NEGATIVE_INFINITY, bottom: start, blur: 0 }
  return [
    sharp,
    ...Array.from({ length: bandCount }, (_, band) => ({
      top: start + band * step,
      // The last band runs on past the foot, where the stamps that hang off it are cut.
      bottom: band === bandCount - 1 ? Number.POSITIVE_INFINITY : start + (band + 1) * step,
      // Evenly stronger down the fade, each band at its middle's share of the foot's blur.
      blur: (strongest * (band + 0.5)) / bandCount,
    })),
  ]
}

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
  const bands = useMemo(() => blurBands(height, stamp), [height, stamp])
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
          bands.map((band) => {
            // A stamp turned a little reaches about 0.72 of its width from its centre, and its
            // blur spreads it by about twice the radius again.
            const reach = stamp * 0.72 + band.blur * 2
            const crossing = deepestFirst.filter(
              ({ down }) => down - reach < band.bottom && down + reach > band.top,
            )
            if (crossing.length === 0) return null
            const top = Number.isFinite(band.top) ? `${band.top}px` : '-1px'
            const bottom = Number.isFinite(band.bottom) ? `${band.bottom}px` : `${height + 1}px`
            return (
              <div
                key={band.top}
                className="absolute inset-0 mix-blend-multiply dark:mix-blend-screen"
                style={{
                  maskImage: `linear-gradient(to bottom, transparent ${top}, black ${top}, black ${bottom}, transparent ${bottom})`,
                  filter: band.blur > 0 ? `blur(${band.blur.toFixed(2)}px)` : undefined,
                }}
              >
                {crossing.map(({ index, across, down }) => {
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
              </div>
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
