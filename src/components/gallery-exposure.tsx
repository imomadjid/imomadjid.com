import type { Ref } from 'react'

import { exposureReadouts } from '#/lib/exposure-format'
import { figuresClass } from '#/lib/figures'
import { cssSpring } from '#/lib/flight-springs'
import type { GalleryPhoto } from '#/lib/gallery'
import type { Rect } from '#/lib/gallery-flight-geometry'
import type { GalleryTuning } from '#/lib/gallery-settings'
import { cn } from '#/lib/utils'
import { wrapLines } from '#/lib/wrap-lines'

/** The gap between the full-screen photo and the readout under it. */
const READOUT_GAP = 12
/** The readout's line height (leading-5) and the gap between its lines (gap-y-1). */
const LINE_HEIGHT = 20
const LINE_GAP = 4

/** The gap between readouts along a line: wider from sm up. */
export const readoutGap = (viewportWidth: number) => (viewportWidth < 640 ? 16 : 24)

/** What the full-screen photo leaves free under it for a readout of `lines` lines. */
export const readoutSpace = (lines: number) =>
  READOUT_GAP + lines * LINE_HEIGHT + (lines - 1) * LINE_GAP

/**
 * Each readout's width, recipe included, rounded up so a line they fit on doesn't wrap by a
 * fraction of a pixel. They don't change with the photo's size.
 */
export const measureReadout = (readout: HTMLElement) =>
  Array.from(readout.children, (item) => Math.ceil(item.getBoundingClientRect().width))

/** Where the readout sits under the photo, and how many lines it takes. */
export type ReadoutRow = { x: number; y: number; width: number; lines: number }

/**
 * The readout's row under `photo`: as wide as the photo, or wider, centred under it, where its
 * items need more room for one line, up to the viewport less its `margin` either side. They wrap
 * only past that, as on a phone. Without measured `widths` it takes the photo's width and a line.
 */
export function readoutRow(
  photo: Rect,
  viewport: Rect,
  margin: number,
  widths: readonly number[] | null,
  gap: number,
): ReadoutRow {
  const room = viewport.width - 2 * margin
  const oneLine = widths
    ? widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1)
    : 0
  const width = Math.min(room, Math.max(photo.width, oneLine))
  const centred = photo.x + (photo.width - width) / 2
  return {
    x: Math.min(Math.max(centred, margin), viewport.width - margin - width),
    y: photo.y + photo.height + READOUT_GAP,
    width,
    lines: widths ? wrapLines(widths, width, gap) : 1,
  }
}

/**
 * The photo's exposure under it, set like a camera's info display: each label beside its
 * readout, in Allo's tabular figures with a slashed zero, from the row's left edge, and the recipe
 * its settings match, if any, linked on the right. The row is `readoutRow`'s. They come up one after another, each rising a little out of a
 * blur on `tuning.motion`'s spring, and go together as the photo's close starts.
 */
export function ExposureReadout({
  ref,
  photo,
  row,
  gap,
  shown,
  tuning,
}: {
  ref: Ref<HTMLDListElement>
  photo: GalleryPhoto
  row: ReadoutRow
  /** readoutGap's. */
  gap: number
  shown: boolean
  tuning: GalleryTuning['readout']
}) {
  const enter = cssSpring(tuning.motion)
  const readouts = exposureReadouts(photo.exposure)
  const { recipe } = photo
  // Each readout's own transition: staggered on the way in, all together on the way out.
  const motion = (index: number, className?: string) => ({
    className: cn(
      'flex items-baseline gap-1.5 whitespace-nowrap transition-[opacity,translate,filter] motion-reduce:transition-none',
      className,
      // Without the flight the photo fades in at once, and the readouts with it.
      'starting:translate-y-1.5 starting:opacity-0 starting:blur-xs',
      !shown && 'translate-y-1.5 opacity-0 blur-xs',
    ),
    style: shown
      ? {
          transitionDuration: `${enter.duration}s`,
          transitionTimingFunction: enter.easing,
          transitionDelay: `${index * tuning.stagger}s`,
        }
      : { transitionDuration: '150ms', transitionTimingFunction: 'ease-in' },
  })
  const valueClass = cn(
    'text-sm leading-5 font-medium text-neutral-950 dark:text-white',
    figuresClass,
  )

  return (
    <dl
      ref={ref}
      // A click on it closes the photo, as one beside it does; only the recipe's link takes one.
      className="pointer-events-none fixed flex flex-wrap items-baseline gap-y-1"
      style={{
        left: row.x,
        top: row.y,
        width: row.width,
        columnGap: gap,
      }}
    >
      {readouts.map(({ label, value }, index) => (
        <div key={label} {...motion(index)}>
          <dt className="text-[10px] font-semibold tracking-[0.08em] text-foreground/50 uppercase dark:text-yellow-400">
            {label}
          </dt>
          <dd className={valueClass}>{value}</dd>
        </div>
      ))}
      {recipe && (
        // On the right of its line, wherever the readouts wrap.
        <div {...motion(readouts.length, 'ml-auto')}>
          <dt className="sr-only">Recipe</dt>
          {/* Its line as tall as the readouts', which readoutSpace counts on. */}
          <dd className="text-sm leading-5">
            <a
              href={recipe.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                valueClass,
                'pointer-events-auto underline decoration-current/30 underline-offset-[3px] transition-[text-decoration-color] duration-150 hover:decoration-current',
              )}
            >
              {recipe.name}
            </a>
          </dd>
        </div>
      )}
    </dl>
  )
}
