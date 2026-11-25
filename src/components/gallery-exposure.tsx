import Scritto from '@scritto/react'
import { IconArrowUpRight } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { exposureReadouts } from '#/lib/exposure-format'
import { figuresClass } from '#/lib/figures'
import { cssSpring, cssTransition } from '#/lib/flight-springs'
import type { GalleryPhoto } from '#/lib/gallery'
import type { GalleryTuning } from '#/lib/gallery-settings'
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

type Rolling = { trend: 1 | -1; transition: { duration: number }; bounce: boolean }

/**
 * A value rolling over glyph by glyph on Scritto, over every value it takes across the set
 * (`values`), stacked unseen in the same place, so its box is as wide as the widest of them and
 * never moves what comes after it: Scritto's own width animation starts a frame late. The stack is
 * set like Scritto sets its glyphs, without kerning or ligatures. Scritto's glyphs are hidden from
 * screen readers, which read the plain value.
 */
function RollingValue({
  value,
  values,
  rolling,
  className,
}: {
  value: string
  values: readonly string[]
  rolling: Rolling
  className?: string
}) {
  return (
    <span className={cn('grid [&>*]:[grid-area:1/1]', className)}>
      {values.map((each) => (
        <span
          key={each}
          aria-hidden="true"
          className="invisible [font-kerning:none] [font-variant-ligatures:none]"
        >
          {each}
        </span>
      ))}
      <span aria-hidden="true">
        <Scritto value={value} {...rolling} />
      </span>
      <span className="sr-only">{value}</span>
    </span>
  )
}

/** Each value of `values` once. */
const distinct = (values: readonly string[]) => [...new Set(values)]

/** Each exposure cell's values across `set`, and the set's recipes' names. */
function setValues(set: readonly GalleryPhoto[]) {
  const all = set.map((each) => exposureReadouts(each.exposure))
  return {
    exposure: (all[0] ?? []).map((_, index) => distinct(all.map((cells) => cells[index].value))),
    recipes: distinct(set.flatMap((each) => (each.recipe ? [each.recipe.name] : []))),
  }
}

/**
 * The photo's exposure under it, set like a camera's info display: each label over its readout,
 * in Allo's tabular figures with a slashed zero, and the recipe its settings match, if any of the
 * set's do, linked at the end. `row` places it (src/lib/readout-layout.ts): one row, the recipe
 * flush right, or on a phone a grid of three columns over two rows. Each cell keeps the width of
 * its widest value across `set` (RollingValue), so nothing moves as values change or a recipe
 * comes and goes. The cells come up one after another, `delay` in, each rising a little out of a
 * blur on `tuning.motion`'s spring, and go together as the photo's close starts. Stepping to
 * another photo rolls each value and the recipe's name over to the new one, on Scritto's bouncy
 * preset, the way the step goes (`trend`); a recipe that the new photo hasn't fades out with its
 * last name. The bar follows the photo's bottom on `follow`.
 */
export function ExposureReadout({
  photo,
  set,
  row,
  shown,
  delay,
  tuning,
  trend,
  roll,
  follow,
}: {
  photo: GalleryPhoto
  /** The photos it steps between, whose values size its cells. */
  set: readonly GalleryPhoto[]
  row: ReadoutRow
  shown: boolean
  /** Seconds before the first cell comes up once `shown`. */
  delay: number
  tuning: GalleryTuning['readout']
  /** Which way the values roll: up stepping forward, down stepping back. */
  trend: 1 | -1
  /** Each glyph's roll, in ms, on Scritto's own bouncy spring. */
  roll: { duration: number }
  /** The bar's move to a photo of another shape's bottom: the photos' outline's spring. */
  follow: { duration: number; easing: string }
}) {
  const enter = useMemo(() => cssSpring(tuning.motion), [tuning.motion])
  const values = useMemo(() => setValues(set), [set])
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
    style: visible
      ? {
          transitionDuration: `${enter.duration}s`,
          transitionTimingFunction: enter.easing,
          transitionDelay: `${delay + index * tuning.stagger}s`,
        }
      : { transitionDuration: '150ms', transitionTimingFunction: 'ease-in' },
  })
  // Scritto's bouncier spring, which overshoots a little as each glyph lands.
  const rolling: Rolling = { trend, transition: roll, bounce: true }

  return (
    <dl
      // A click on it closes the photo, as one beside it does; only the recipe's link takes one,
      // and only while it shows.
      className={cn(
        'pointer-events-none fixed w-max -translate-x-1/2 motion-reduce:transition-none!',
        row.grid
          ? 'grid grid-cols-[repeat(3,auto)] justify-between gap-x-5 gap-y-3'
          : 'flex gap-x-8',
      )}
      style={{
        left: row.center,
        top: row.y,
        minWidth: row.minWidth,
        maxWidth: row.maxWidth,
        transition: cssTransition('top', follow),
      }}
    >
      {readouts.map(({ label, value }, index) => (
        <div key={label} {...motion(index, shown)}>
          <dt className={labelClass}>{label}</dt>
          <dd className={valueClass}>
            <RollingValue value={value} values={values.exposure[index]} rolling={rolling} />
          </dd>
        </div>
      ))}
      {values.recipes.length > 0 && (
        // In its place even before a photo with a recipe, so the cells never shift; in the row,
        // flush right.
        <div
          {...motion(
            readouts.length,
            shown && recipe !== null,
            row.grid ? undefined : 'ml-auto items-end',
          )}
          aria-hidden={recipe ? undefined : true}
        >
          <dt className={labelClass}>Recipe</dt>
          <dd className={valueClass}>
            <a
              href={lastRecipe?.url}
              target="_blank"
              rel="noreferrer"
              tabIndex={recipe ? undefined : -1}
              className={cn(
                'flex items-center gap-0.5 rounded-sm transition-opacity hover:opacity-70',
                shown && recipe && 'pointer-events-auto',
              )}
            >
              <RollingValue
                value={lastRecipe?.name ?? ''}
                values={values.recipes}
                rolling={rolling}
                className={row.grid ? undefined : 'justify-items-end'}
              />
              <IconArrowUpRight aria-hidden="true" className="size-3.5 opacity-50" />
            </a>
          </dd>
        </div>
      )}
    </dl>
  )
}
