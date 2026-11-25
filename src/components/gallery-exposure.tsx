import { useMemo } from 'react'
import type { Ref } from 'react'

import { exposureReadouts } from '#/lib/exposure-format'
import { figuresClass } from '#/lib/figures'
import { cssSpring } from '#/lib/flight-springs'
import type { GalleryPhoto } from '#/lib/gallery'
import type { GalleryTuning } from '#/lib/gallery-settings'
import type { ReadoutRow } from '#/lib/readout-layout'
import { textLinkClass } from '#/lib/text-link'
import { cn } from '#/lib/utils'

/**
 * Each readout's width, recipe included, rounded up so a line they fit on doesn't wrap by a
 * fraction of a pixel. They don't change with the photo's size or the viewport's.
 */
export const measureReadout = (readout: HTMLElement) =>
  Array.from(readout.children, (item) => Math.ceil(item.getBoundingClientRect().width))

/**
 * The photo's exposure under it, set like a camera's info display: each label beside its
 * readout, in Allo's tabular figures with a slashed zero, from the row's left edge, and the recipe
 * its settings match, if any, linked on the right. `row` places it (src/lib/readout-layout.ts).
 * The readouts come up one after another, `delay` in, each rising a little out of a blur on
 * `tuning.motion`'s spring, and go together as the photo's close starts.
 */
export function ExposureReadout({
  ref,
  photo,
  row,
  shown,
  delay,
  tuning,
}: {
  ref: Ref<HTMLDListElement>
  photo: GalleryPhoto
  row: ReadoutRow
  shown: boolean
  /** Seconds before the first readout comes up once `shown`. */
  delay: number
  tuning: GalleryTuning['readout']
}) {
  const enter = useMemo(() => cssSpring(tuning.motion), [tuning.motion])
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
          transitionDelay: `${delay + index * tuning.stagger}s`,
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
      // A click on it closes the photo, as one beside it does; only the recipe's link takes one,
      // and only while it shows.
      className="pointer-events-none fixed flex flex-wrap items-baseline gap-y-1"
      style={{ left: row.x, top: row.y, width: row.width, columnGap: row.gap }}
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
          <dd className={valueClass}>
            <a
              href={recipe.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                textLinkClass,
                'text-neutral-950 dark:text-white',
                shown && 'pointer-events-auto',
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
