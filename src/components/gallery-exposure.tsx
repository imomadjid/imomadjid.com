import { exposureReadouts } from '#/lib/exposure-format'
import { figuresClass } from '#/lib/figures'
import { cssSpring } from '#/lib/flight-springs'
import type { GalleryPhoto } from '#/lib/gallery'
import type { Rect } from '#/lib/gallery-flight-geometry'
import type { GalleryTuning } from '#/lib/gallery-settings'
import { cn } from '#/lib/utils'

/** The gap between the full-screen photo and the readout under it. */
const READOUT_GAP = 12
/** The readout's line height (leading-5) and the gap between its lines on a phone (gap-y-1). */
const LINE_HEIGHT = 20
const LINE_GAP = 4

/**
 * What the full-screen photo leaves free under it for the readout: a line, or on a phone (below
 * sm) two, since the five readouts don't fit across one.
 */
export function readoutSpace(viewportWidth: number) {
  const lines = viewportWidth < 640 ? 2 : 1
  return READOUT_GAP + lines * LINE_HEIGHT + (lines - 1) * LINE_GAP
}

/**
 * The photo's exposure under it, on one line or two on a phone, set like a camera's info
 * display: each yellow label beside its readout, in Allo's tabular figures with a slashed zero.
 * The readouts come up one after another, each rising a little out of a blur on `tuning.motion`'s
 * spring, and go together as the photo's close starts.
 */
export function ExposureReadout({
  photo,
  rect,
  shown,
  tuning,
}: {
  photo: GalleryPhoto
  /** The full-screen photo's rect. */
  rect: Rect
  shown: boolean
  tuning: GalleryTuning['readout']
}) {
  const enter = cssSpring(tuning.motion)

  return (
    <dl
      // Across the viewport, the lines centred under the photo, which the viewport centres too.
      // A click on it closes the photo, as one beside it does.
      className="pointer-events-none fixed inset-x-3 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 sm:gap-x-6"
      style={{ top: rect.y + rect.height + READOUT_GAP }}
    >
      {exposureReadouts(photo.exposure).map(({ label, value }, index) => (
        <div
          key={label}
          className={cn(
            'flex items-baseline gap-1.5 whitespace-nowrap transition-[opacity,translate,filter] motion-reduce:transition-none',
            // Without the flight the photo fades in at once, and the readouts with it.
            'starting:translate-y-1.5 starting:opacity-0 starting:blur-xs',
            !shown && 'translate-y-1.5 opacity-0 blur-xs',
          )}
          style={
            shown
              ? {
                  transitionDuration: `${enter.duration}s`,
                  transitionTimingFunction: enter.easing,
                  transitionDelay: `${index * tuning.stagger}s`,
                }
              : { transitionDuration: '150ms', transitionTimingFunction: 'ease-in' }
          }
        >
          <dt className="text-[10px] font-semibold tracking-[0.08em] text-amber-700 uppercase dark:text-yellow-400">
            {label}
          </dt>
          <dd
            className={cn(
              'text-sm leading-5 font-medium text-neutral-950 dark:text-white',
              figuresClass,
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
