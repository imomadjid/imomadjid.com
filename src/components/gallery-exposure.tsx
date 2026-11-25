import Scritto from '@scritto/react'
import { IconArrowUpRight } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import type { Ref } from 'react'

import { exposureReadouts } from '#/lib/exposure-format'
import { figuresClass } from '#/lib/figures'
import { cssSpring, cssTransition } from '#/lib/flight-springs'
import type { GalleryPhoto } from '#/lib/gallery'
import type { GalleryTuning } from '#/lib/gallery-settings'
import { gridColumns } from '#/lib/readout-layout'
import type { ReadoutRow } from '#/lib/readout-layout'
import { cn } from '#/lib/utils'

// A cell: its label over its value, as a camera's info display stacks them.
const cellClass = 'flex flex-col gap-0.5 whitespace-nowrap'
const labelClass =
  'text-[10px] leading-3.5 font-semibold tracking-[0.08em] text-foreground/50 uppercase dark:text-yellow-400'
const valueClass = cn(
  'text-sm leading-5 font-medium text-neutral-950 dark:text-white',
  figuresClass,
)
// The recipe's cell sits at the end of the row, flush right, or in a phone's third column.
const recipeCellClass = 'ml-auto items-end max-sm:ml-0 max-sm:items-start'
const recipeIcon = <IconArrowUpRight aria-hidden="true" className="size-3.5 opacity-50" />

/**
 * Each cell's width, the recipe's included, rounded up so a slot they fit doesn't come up short
 * by a fraction of a pixel. They don't change with the photo's size or the viewport's.
 */
export const measureReadout = (readout: Element) =>
  Array.from(readout.children, (cell) => Math.ceil(cell.getBoundingClientRect().width))

/**
 * The readouts of every photo in `photos`, their cells set as ExposureReadout sets them but
 * unseen, for `measureReadout`: each cell keeps a slot as wide as its widest across the set, so
 * stepping between photos doesn't move it. Set like Scritto sets its glyphs, without kerning or
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
            <div key={label} className={cellClass}>
              <span className={labelClass}>{label}</span>
              <span className={valueClass}>{value}</span>
            </div>
          ))}
          {photo.recipe && (
            <div className={cellClass}>
              <span className={labelClass}>Recipe</span>
              <span className={cn(valueClass, 'flex items-center gap-0.5')}>
                {photo.recipe.name}
                {recipeIcon}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * The photo's exposure under it, set like a camera's info display: each label over its readout,
 * in Allo's tabular figures with a slashed zero, and the recipe its settings match, if any, linked
 * at the end. `row` places it (src/lib/readout-layout.ts): one row from `sm` up, the recipe flush
 * right; on a phone, a grid of three columns over two rows. Each cell keeps its slot (`slots`),
 * so nothing moves as values change. The cells come up one after another, `delay` in, each rising
 * a little out of a blur on `tuning.motion`'s spring, and go together as the photo's close
 * starts. Stepping to another photo rolls each value and the recipe's name over to the new one,
 * glyph by glyph on Scritto's bouncy preset, the way the step goes (`trend`); a recipe that the
 * new photo hasn't fades out with its last name, and its cell keeps its place. The bar follows
 * the photo's bottom on `follow`.
 */
export function ExposureReadout({
  photo,
  row,
  shown,
  delay,
  tuning,
  trend,
  roll,
  slots,
  follow,
}: {
  photo: GalleryPhoto
  row: ReadoutRow
  shown: boolean
  /** Seconds before the first cell comes up once `shown`. */
  delay: number
  tuning: GalleryTuning['readout']
  /** Which way the values roll: up stepping forward, down stepping back. */
  trend: 1 | -1
  /** Scritto's roll, each glyph's: a duration in ms, and an easing, or its own bouncy spring. */
  roll: { duration: number; easing?: string }
  /**
   * Each cell's least width: the widest it takes across the photos it steps between
   * (readoutSlots), so a value that grows doesn't push the cells after it. Empty until measured.
   */
  slots: readonly number[]
  /** The bar's move to a photo of another shape's bottom: the photos' outline's spring. */
  follow: { duration: number; easing: string }
}) {
  const enter = useMemo(() => cssSpring(tuning.motion), [tuning.motion])
  const readouts = exposureReadouts(photo.exposure)
  const { recipe } = photo
  // The last recipe shown, kept while the recipe fades out under a photo without one.
  const [lastRecipe, setLastRecipe] = useState(recipe)
  if (recipe && recipe !== lastRecipe) setLastRecipe(recipe)
  // Each cell's own transition: staggered on the way in, all together on the way out.
  const motion = (index: number, visible: boolean, className?: string) => ({
    className: cn(
      cellClass,
      'transition-[opacity,translate,filter] motion-reduce:transition-none',
      className,
      // Without the flight the photo fades in at once, and the cells with it.
      'starting:translate-y-1.5 starting:opacity-0 starting:blur-xs',
      !visible && 'translate-y-1.5 opacity-0 blur-xs',
    ),
    style: {
      minWidth: slots[index],
      ...(visible
        ? {
            transitionDuration: `${enter.duration}s`,
            transitionTimingFunction: enter.easing,
            transitionDelay: `${delay + index * tuning.stagger}s`,
          }
        : { transitionDuration: '150ms', transitionTimingFunction: 'ease-in' }),
    },
  })
  // Scritto's bouncier spring, which overshoots a little as each glyph lands. Its glyphs are hidden
  // from screen readers (a string: React writes `true` on a custom element as an empty attribute,
  // which doesn't hide it), so the plain value is read beside it.
  const rolling = { trend, transition: roll, bounce: true, 'aria-hidden': 'true' }
  // A phone's three columns, each as wide as its widest cell across the set, so a recipe coming
  // or going doesn't move them.
  const columns = slots.length > 0 ? gridColumns(slots).map((width) => `${width}px`) : undefined

  return (
    <dl
      // A click on it closes the photo, as one beside it does; only the recipe's link takes one,
      // and only while it shows.
      className="pointer-events-none fixed flex gap-x-8 motion-reduce:transition-none! max-sm:grid max-sm:grid-cols-[repeat(3,auto)] max-sm:justify-between max-sm:gap-x-5 max-sm:gap-y-3"
      style={{
        left: row.x,
        top: row.y,
        width: row.width,
        transition: cssTransition('top', follow),
        gridTemplateColumns: columns?.join(' '),
      }}
    >
      {readouts.map(({ label, value }, index) => (
        <div key={label} {...motion(index, shown)}>
          <dt className={labelClass}>{label}</dt>
          <dd className={valueClass}>
            <Scritto value={value} {...rolling} />
            <span className="sr-only">{value}</span>
          </dd>
        </div>
      ))}
      {lastRecipe && (
        <div
          {...motion(readouts.length, shown && recipe !== null, recipeCellClass)}
          aria-hidden={recipe ? undefined : true}
        >
          <dt className={labelClass}>Recipe</dt>
          <dd className={valueClass}>
            <a
              href={lastRecipe.url}
              target="_blank"
              rel="noreferrer"
              tabIndex={recipe ? undefined : -1}
              className={cn(
                'flex items-center gap-0.5 rounded-sm transition-opacity hover:opacity-70',
                shown && recipe && 'pointer-events-auto',
              )}
            >
              <Scritto value={lastRecipe.name} {...rolling} />
              <span className="sr-only">{lastRecipe.name}</span>
              {recipeIcon}
            </a>
          </dd>
        </div>
      )}
    </dl>
  )
}
