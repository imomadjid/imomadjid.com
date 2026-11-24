import { exposureReadouts, formatLens } from '#/lib/exposure-format'
import { figuresClass } from '#/lib/figures'
import type { GalleryPhoto } from '#/lib/gallery'
import type { Rect } from '#/lib/gallery-flight-geometry'
import { cn } from '#/lib/utils'

/** The gap between the full-screen photo and the readout under it. */
const READOUT_GAP = 8
/** The readout's height: h-14. */
const READOUT_HEIGHT = 56
/** What the full-screen photo leaves free under it for the readout. */
export const READOUT_SPACE = READOUT_GAP + READOUT_HEIGHT

/**
 * The photo's exposure under it, set like a camera's info display: yellow labels over white
 * readouts on a dark strip, in Allo's tabular figures with a slashed zero. As wide as the photo,
 * or wider, centred under it, if the readouts need more room. It comes up once the photo has
 * landed and goes as its close starts.
 */
export function ExposureReadout({
  photo,
  rect,
  margin,
  shown,
}: {
  photo: GalleryPhoto
  /** The full-screen photo's rect. */
  rect: Rect
  /** The photo's margin from the viewport's sides, which the strip keeps too. */
  margin: number
  shown: boolean
}) {
  const readouts = [
    ...exposureReadouts(photo.exposure),
    { label: 'Lens', value: formatLens(photo.exposure.lens) },
  ]

  return (
    <dl
      className={cn(
        'fixed flex h-14 -translate-x-1/2 cursor-auto items-center justify-between gap-x-4 rounded-xl bg-neutral-950 px-4 text-white ring-1 ring-white/10 sm:gap-x-6',
        'transition-[opacity,translate,filter] motion-reduce:transition-none',
        // Without the flight the photo fades in at once, and the strip with it.
        'starting:translate-y-1 starting:opacity-0 starting:blur-xs',
        shown
          ? 'duration-250 ease-out'
          : 'pointer-events-none translate-y-1 opacity-0 blur-xs duration-150 ease-in',
      )}
      style={{
        left: rect.x + rect.width / 2,
        top: rect.y + rect.height + READOUT_GAP,
        minWidth: rect.width,
        maxWidth: `calc(100vw - ${2 * margin}px)`,
      }}
    >
      {readouts.map(({ label, value }) => (
        <div
          key={label}
          // Phones keep the room for the exposure.
          className={cn('grid gap-0.5', label === 'Lens' && 'text-right max-sm:hidden')}
        >
          <dt className="text-[10px] leading-3 font-semibold tracking-[0.08em] text-yellow-400 uppercase">
            {label}
          </dt>
          <dd className={cn('text-sm leading-5 font-medium', figuresClass)}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
