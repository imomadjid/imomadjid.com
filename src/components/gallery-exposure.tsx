import Scritto from '@scritto/react'
import { useMemo, useState } from 'react'
import type { Ref } from 'react'

import { exposureReadouts } from '#/lib/exposure-format'
import { figuresClass } from '#/lib/figures'
import { cssSpring } from '#/lib/flight-springs'
import type { GalleryPhoto } from '#/lib/gallery'
import type { GalleryTuning } from '#/lib/gallery-settings'
import type { ReadoutRow } from '#/lib/readout-layout'
import { textLinkClass } from '#/lib/text-link'
import { cn } from '#/lib/utils'

const itemClass = 'flex items-baseline gap-1.5 whitespace-nowrap'
const labelClass =
  'text-[10px] font-semibold tracking-[0.08em] text-foreground/50 uppercase dark:text-yellow-400'
const valueClass = cn(
  'text-sm leading-5 font-medium text-neutral-950 dark:text-white',
  figuresClass,
)

/**
 * Each readout's width, recipe included, rounded up so a line they fit on doesn't wrap by a
 * fraction of a pixel. They don't change with the photo's size or the viewport's.
 */
export const measureReadout = (readout: Element) =>
  Array.from(readout.children, (item) => Math.ceil(item.getBoundingClientRect().width))

/**
 * The readouts of every photo in `photos`, laid out as ExposureReadout sets them but unseen, for
 * `measureReadout`: the lightbox sizes its bar for the widest and longest of them, so stepping
 * between photos doesn't change it. Set like Scritto sets its glyphs, without kerning or
 * ligatures, so they measure what shows.
 */
export function ReadoutMeasures({
  ref,
  photos,
}: {
  ref: Ref<HTMLDivElement>
  photos: readonly GalleryPhoto[]
}) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none invisible fixed top-0 left-0 [font-kerning:none] [font-variant-ligatures:none]"
    >
      {photos.map((photo) => (
        <div key={photo.id} className="flex w-max">
          {exposureReadouts(photo.exposure).map(({ label, value }) => (
            <div key={label} className={itemClass}>
              <span className={labelClass}>{label}</span>
              <span className={valueClass}>{value}</span>
            </div>
          ))}
          {photo.recipe && (
            <div className={itemClass}>
              <span className={valueClass}>{photo.recipe.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * The photo's exposure under it, set like a camera's info display: each label beside its
 * readout, in Allo's tabular figures with a slashed zero, from the row's left edge, and the recipe
 * its settings match, if any, linked on the right. `row` places it across (src/lib/readout-layout.ts);
 * the lightbox moves its top with the photo's bottom. The readouts come up one after another,
 * `delay` in, each rising a little out of a blur on `tuning.motion`'s spring, and go together as
 * the photo's close starts. Stepping to another photo rolls each value and the recipe's name
 * over to the new one, glyph by glyph on Scritto's bouncy preset, the way the step goes (`trend`); a recipe that
 * the new photo hasn't fades out with its last name.
 */
export function ExposureReadout({
  ref,
  photo,
  row,
  shown,
  delay,
  tuning,
  trend,
  roll,
}: {
  ref: Ref<HTMLDListElement>
  photo: GalleryPhoto
  row: ReadoutRow
  shown: boolean
  /** Seconds before the first readout comes up once `shown`. */
  delay: number
  tuning: GalleryTuning['readout']
  /** Which way the values roll: up stepping forward, down stepping back. */
  trend: 1 | -1
  /** Scritto's roll, each glyph's: a duration in ms, and an easing, or its own bouncy spring. */
  roll: { duration: number; easing?: string }
}) {
  const enter = useMemo(() => cssSpring(tuning.motion), [tuning.motion])
  const readouts = exposureReadouts(photo.exposure)
  const { recipe } = photo
  // The last recipe shown, kept while the recipe fades out under a photo without one.
  const [lastRecipe, setLastRecipe] = useState(recipe)
  if (recipe && recipe !== lastRecipe) setLastRecipe(recipe)
  // Each readout's own transition: staggered on the way in, all together on the way out.
  const motion = (index: number, visible: boolean, className?: string) => ({
    className: cn(
      itemClass,
      'transition-[opacity,translate,filter] motion-reduce:transition-none',
      className,
      // Without the flight the photo fades in at once, and the readouts with it.
      'starting:translate-y-1.5 starting:opacity-0 starting:blur-xs',
      !visible && 'translate-y-1.5 opacity-0 blur-xs',
    ),
    style: visible
      ? {
          transitionDuration: `${enter.duration}s`,
          transitionTimingFunction: enter.easing,
          transitionDelay: `${delay + index * tuning.stagger}s`,
        }
      : { transitionDuration: '150ms', transitionTimingFunction: 'ease-in' },
  })
  // Scritto's bouncier spring, which overshoots a little as each glyph lands. Its own label is an
  // image role; without it the value reads as the plain text it keeps.
  const rolling = {
    trend,
    transition: roll,
    bounce: true,
    role: undefined,
    'aria-label': undefined,
  }

  return (
    <dl
      ref={ref}
      // A click on it closes the photo, as one beside it does; only the recipe's link takes one,
      // and only while it shows.
      className="pointer-events-none fixed flex flex-wrap items-baseline gap-y-1"
      style={{ left: row.x, width: row.width, columnGap: row.gap }}
    >
      {readouts.map(({ label, value }, index) => (
        <div key={label} {...motion(index, shown)}>
          <dt className={labelClass}>{label}</dt>
          <dd className={valueClass}>
            <Scritto value={value} {...rolling} />
          </dd>
        </div>
      ))}
      {lastRecipe && (
        // On the right of its line, wherever the readouts wrap.
        <div
          {...motion(readouts.length, shown && recipe !== null, 'ml-auto')}
          aria-hidden={recipe ? undefined : true}
        >
          <dt className="sr-only">Recipe</dt>
          <dd className={valueClass}>
            <a
              href={lastRecipe.url}
              target="_blank"
              rel="noreferrer"
              tabIndex={recipe ? undefined : -1}
              className={cn(
                textLinkClass,
                // Scritto sets each glyph in a box of its own, which a text underline skips, so
                // the underline is a line under the whole name, following its width as it rolls.
                'relative text-neutral-950 no-underline after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-neutral-300 dark:text-white dark:after:bg-neutral-600',
                shown && recipe && 'pointer-events-auto',
              )}
            >
              <Scritto value={lastRecipe.name} {...rolling} />
            </a>
          </dd>
        </div>
      )}
    </dl>
  )
}
