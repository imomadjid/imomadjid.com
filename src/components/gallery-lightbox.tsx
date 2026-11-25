import { Dialog } from '@base-ui/react/dialog'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { play } from 'cuelume'
import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent, RefObject } from 'react'
import { flushSync } from 'react-dom'

import { ExposureReadout, measureReadout, ReadoutMeasures } from '#/components/gallery-exposure'
import type { FlightStage } from '#/components/gallery-flight-stage'
import { IconButton } from '#/components/ui/icon-button'
import { dialogCoverClass } from '#/lib/dialog-layer'
import { exposureReadouts } from '#/lib/exposure-format'
import { cssSpring, springResponse } from '#/lib/flight-springs'
import type { GalleryPhoto } from '#/lib/gallery'
import type { FlightPose } from '#/lib/gallery-flight'
import {
  containRect,
  cornerLags,
  cornerRadius,
  coverCrop,
  diagonal,
  quadOf,
  viewportRect,
  wholeImage,
} from '#/lib/gallery-flight-geometry'
import type { Rect } from '#/lib/gallery-flight-geometry'
import { decodedImage, decodedNow } from '#/lib/gallery-images'
import type { GalleryTuning } from '#/lib/gallery-settings'
import { fullScaleRect, revealReceded } from '#/lib/page-recede'
import { readoutBar, readoutSlots, readoutSpace } from '#/lib/readout-layout'
import { TILE_RADIUS } from '#/lib/see-more-grid'
import { cn } from '#/lib/utils'

type Phase = 'opening' | 'open' | 'closing'

/** Which way a step goes through the set: 1 to the next photo, -1 to the previous. */
type Step = 1 | -1

/**
 * A full-screen photo, in a rounded frame of its own at its own size. Stepping adds the new
 * photo's layer over the last one, which leaves, sliding and blurring out the way the step goes
 * inside its frame as the new one slides and unblurs in inside its own.
 */
type Layer = {
  key: number
  photo: GalleryPhoto
  /** The step that brought it in, or 0 for the photo the lightbox opened on, which doesn't slide. */
  step: Step | 0
  /** The step that took it out, once it is leaving. */
  leaving?: Step
  /**
   * Whether it fades out leaving: when the photo coming in has another shape (portrait and
   * landscape), as that one doesn't cover it. One of the same shape covers it as it fades up over
   * it in the same frame, so it stays.
   */
  fadesOut?: boolean
}

type Shown = {
  photo: GalleryPhoto
  /** The tile or grid cell the photo lifts out of and lands back in. */
  tile: HTMLElement
  phase: Phase
  /** True once the flight canvas has drawn the photo, so the tile can let go of it. */
  airborne: boolean
  /** The photos the arrows step through, in order: the featured ones, or the overlay's. */
  set: readonly GalleryPhoto[]
  /**
   * Each photo of the set's readout's items' widths, which size the readout's bar and set how many
   * lines it needs; empty until measured.
   */
  readouts: readonly (readonly number[])[]
  /** Each exposure readout's slot width (readoutSlots), which the readouts take in the bar. */
  slots: readonly number[]
  /** The photos on screen, the current one last. */
  layers: readonly Layer[]
  /** The last step's way, which the readout's values roll. */
  trend: Step
}

/** Opens `photo` full screen out of `tile`, stepping through `set` from there. */
type OpenPhotoIn = (
  photo: GalleryPhoto,
  tile: HTMLElement,
  keyboard: boolean,
  set: readonly GalleryPhoto[],
) => void

/**
 * Focuses `to.tile` as a closing Gallery dialog's `finalFocus`, without scrolling, and as keyboard
 * focus (ring, hover zoom) only if a key opened the dialog. Falls back to Base UI's default.
 */
export function returnFocus(to: { tile: HTMLElement; keyboard: boolean } | null) {
  if (!to?.tile.isConnected) return true
  to.tile.focus({ preventScroll: true, focusVisible: to.keyboard })
  return false
}

/**
 * The backdrop both Gallery dialogs dim the page with, thin enough for the page's shrink to show:
 * this on the Dialog.Backdrop, with a `GalleryBackdropFill` in it. The fill is a child, so Safari
 * doesn't take the backdrop for a dimming layer (src/lib/dialog-layer.ts). The backdrop itself
 * never fades: an ancestor below full opacity is a backdrop root, which the fill's blur can't see
 * past, so the page would stay sharp under the fading tint and blur all at once at the end. The
 * fill blurs and tints in instead (Base UI waits on the popup's exit, not the backdrop's).
 */
export const galleryBackdropClass = cn(dialogCoverClass, 'group/backdrop z-50')

// The fill's way in and out: its blur and tint, and the edge strips' opacity, from nothing, as
// the backdrop mounts (data-starting-style), leaves (data-ending-style) or a flight home starts.
const fillMotion =
  'transition-[background-color,backdrop-filter,opacity] duration-300 ease-out group-data-ending-style/backdrop:duration-200 motion-reduce:transition-none'
const fillHidden = {
  tint: 'bg-surface-1/0 backdrop-blur-[0px]',
  starting:
    'group-data-starting-style/backdrop:bg-surface-1/0 group-data-starting-style/backdrop:backdrop-blur-[0px] group-data-ending-style/backdrop:bg-surface-1/0 group-data-ending-style/backdrop:backdrop-blur-[0px]',
  strip: 'opacity-0',
  stripStarting:
    'group-data-starting-style/backdrop:opacity-0 group-data-ending-style/backdrop:opacity-0',
}

// On touch screens Safari bands its bars in the page's colour over a blurred backdrop
// (src/lib/dialog-layer.ts), which leaves a seam where the blur shows darker photos. A strip of
// that colour at each edge, fading into the blur, makes the band read as part of it.
const edgeFadeClass =
  'pointer-events-none fixed inset-x-0 hidden h-3 bg-surface-1 pointer-coarse:block after:absolute after:inset-x-0 after:h-12 after:from-surface-1 after:to-transparent'

/**
 * The Gallery backdrop's colour and blur, in its Dialog.Backdrop (galleryBackdropClass): blurring
 * and tinting in as it opens, and back out as it closes, or from the start of a `closing` flight.
 */
export function GalleryBackdropFill({ closing = false }: { closing?: boolean }) {
  const strip = cn(edgeFadeClass, fillMotion, fillHidden.stripStarting, closing && fillHidden.strip)
  return (
    <>
      <span
        className={cn(
          'absolute inset-0 bg-surface-1/80 backdrop-blur-md',
          fillMotion,
          fillHidden.starting,
          closing && cn(fillHidden.tint, 'duration-200'),
        )}
      />
      <span className={cn(strip, '-top-[7px] after:top-full after:bg-linear-to-b')} />
      <span className={cn(strip, '-bottom-[7px] after:bottom-full after:bg-linear-to-t')} />
    </>
  )
}

// The full-screen photo follows the viewport the flight measures (viewportRect), so it lands
// where the image shows.
const viewportWidth = () => document.documentElement.clientWidth
const viewportHeight = () => document.documentElement.clientHeight
const serverSize = () => 0
const subscribeNever = () => () => {}
function subscribeResize(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

/** The viewport, following resizes only while `active`, so a closed lightbox costs nothing. */
function useViewport(active: boolean): Rect {
  const subscribe = active ? subscribeResize : subscribeNever
  const width = useSyncExternalStore(subscribe, viewportWidth, serverSize)
  const height = useSyncExternalStore(subscribe, viewportHeight, serverSize)
  return { x: 0, y: 0, width, height }
}

/** Phones: below `sm`, where the readout pins to the bottom. */
const isPhone = (viewport: Rect) => viewport.width < 640

/** The full-screen photo's margin from the viewport's edges. */
const screenMargin = (viewport: Rect) => (isPhone(viewport) ? 12 : 24)

const aspectOf = (photo: GalleryPhoto) => photo.width / photo.height

/**
 * Where the full-screen photo sits, as large as fits an even margin from the edges and the room
 * its exposure readout's lines take under it, and the readout's bar. The bar is the same under
 * every photo of `set`: as wide as the widest of them shows (a landscape photo's), so a portrait
 * one narrows the frame but not the bar, and as many lines as the readout that wraps most. It
 * wraps only where the viewport is too narrow for its line, so its lines are known before the
 * photo is placed.
 */
function fullScreenLayout(
  viewport: Rect,
  photo: GalleryPhoto,
  set: readonly GalleryPhoto[],
  readouts: readonly (readonly number[])[],
) {
  const side = screenMargin(viewport)
  const { lines } = readoutBar(viewport, side, readouts)
  const insets = { top: side, right: side, bottom: side + readoutSpace(lines), left: side }
  const rectOf = (aspect: number) => containRect(viewport, aspect, insets)
  const span = Math.max(...[photo, ...set].map((each) => rectOf(aspectOf(each)).width))
  const rect = rectOf(aspectOf(photo))
  return {
    photo: rect,
    // On a phone the readout pins to the bottom, so a step to a photo of another shape doesn't
    // move it; the photo sits in the middle of the room above it.
    readout: readoutBar(viewport, side, readouts, span, isPhone(viewport) ? 'pinned' : rect),
    side,
    /** Any photo's full-screen rect. */
    rectOf: (each: GalleryPhoto) => rectOf(aspectOf(each)),
    /** The middle of the room the photos take, which the arrows sit level with. */
    middle: (insets.top + viewport.height - insets.bottom) / 2,
  }
}

/** The whole photo in its full-screen rect. */
function fullScreenPose(
  viewport: Rect,
  photo: GalleryPhoto,
  set: readonly GalleryPhoto[],
  readouts: readonly (readonly number[])[],
): FlightPose {
  return {
    corners: quadOf(fullScreenLayout(viewport, photo, set, readouts).photo),
    texels: quadOf(wholeImage),
    radius: TILE_RADIUS,
  }
}

/** The tile of `photo` in the same set as `tile`, which carries `data-gallery-set` around it. */
function tileOf(tile: HTMLElement, photo: GalleryPhoto) {
  return (
    tile
      .closest('[data-gallery-set]')
      ?.querySelector<HTMLElement>(`[data-photo-id="${CSS.escape(photo.id)}"]`) ?? null
  )
}

/**
 * How a photo layer moves in and out inside its frame: its slide, zoom, blur and opacity. A layer
 * coming in starts from where a leaving one ends, on the far side, through @starting-style, and
 * fades up over the leaving one; the photo the lightbox opened on starts where it rests. Each
 * slides by `shift` of its frame and scales up by twice it, so the slide never uncovers its edges.
 * A leaving photo of the same shape as the new one stays opaque under it, so the frame doesn't dim
 * halfway; one of another shape fades out (`fadesOut`).
 */
function layerMotion(
  layer: Layer,
  tuning: Pick<GalleryTuning['navigate'], 'shift' | 'blur'>,
  transition: { duration: number; easing: string },
) {
  const way = layer.leaving ? -layer.leaving : layer.step
  const style: CSSProperties & Record<`--${string}`, string> = {
    '--layer-shift': `${way * tuning.shift * 100}%`,
    '--layer-zoom': String(1 + 2 * tuning.shift),
    '--layer-blur': `${tuning.blur}px`,
    transition: ['translate', 'scale', 'filter', 'opacity']
      .map((property) => `${property} ${transition.duration}s ${transition.easing}`)
      .join(', '),
  }
  const className = layer.leaving
    ? cn(
        // With reduced motion the photos swap at once, and the leaving one doesn't move first.
        'motion-safe:[translate:var(--layer-shift)_0] motion-safe:[scale:var(--layer-zoom)] motion-safe:[filter:blur(var(--layer-blur))]',
        layer.fadesOut && 'opacity-0',
      )
    : layer.step !== 0 &&
      'starting:opacity-0 starting:[filter:blur(var(--layer-blur))] starting:[scale:var(--layer-zoom)] starting:[translate:var(--layer-shift)_0]'
  return { style, className }
}

/**
 * A photo filling its tile, its box at `rect`, as object-fit: cover shows it, with the tile's own
 * corners.
 */
function tilePose(photo: GalleryPhoto, tile: HTMLElement, rect: Rect): FlightPose {
  return {
    corners: quadOf(rect),
    texels: quadOf(coverCrop(photo.width / photo.height, rect.width / rect.height)),
    radius: cornerRadius(tile),
  }
}

/**
 * Seconds the readout waits to come up. Flying, it waits `readout.start` of the open's response:
 * it comes up while the photo settles, so the two overlap rather than run one after the other.
 */
const readoutDelay = (phase: Phase, tuning: Pick<GalleryTuning, 'expand' | 'readout'>) =>
  phase === 'opening' ? springResponse(tuning.expand.open) * tuning.readout.start : 0

/**
 * The photo a step from the open one goes to, its tile, and its place in the set; null before the
 * open lands, past either end of the set, or if its tile has gone.
 */
function stepFrom(shown: Shown | null, step: Step) {
  if (shown?.phase !== 'open') return null
  const index = shown.set.indexOf(shown.photo) + step
  const photo = shown.set[index]
  const tile = photo && tileOf(shown.tile, photo)
  return tile ? { photo, tile, index } : null
}

/**
 * The layers once a step brings `photo` in as layer `key`: the ones there leave the way the step
 * goes, fading out unless they have its shape. Each step's own timer clears the ones it sent out
 * (settledLayers).
 */
function steppedLayers(
  layers: readonly Layer[],
  photo: GalleryPhoto,
  step: Step,
  key: number,
): Layer[] {
  const landscape = aspectOf(photo) >= 1
  const leaving = layers.map((layer) =>
    layer.leaving
      ? layer
      : { ...layer, leaving: step, fadesOut: aspectOf(layer.photo) >= 1 !== landscape },
  )
  return [...leaving, { key, photo, step }]
}

/** The layers left once the step `key` brought in has finished: the ones it sent out are gone. */
const settledLayers = (layers: readonly Layer[], key: number) =>
  layers.filter((layer) => !layer.leaving || layer.key > key)

/**
 * Fades the photo's place from tile `from` to tile `to` in the grid behind as a step hands it on:
 * `data-step-fade` gives both a transition while `data-lifted` moves from one to the other, and
 * goes once they have faded, so a takeoff or a landing hides or shows a tile at once.
 */
function fadeHandOff(from: HTMLElement, to: HTMLElement) {
  for (const tile of [from, to]) {
    tile.setAttribute('data-step-fade', '')
    clearTimeout(Number(tile.dataset.stepFadeTimer))
    tile.dataset.stepFadeTimer = String(
      window.setTimeout(() => {
        tile.removeAttribute('data-step-fade')
        delete tile.dataset.stepFadeTimer
      }, 400),
    )
  }
}

/**
 * The popup's ways to step: the arrow keys, and a swipe across on a touch screen; a swipe down
 * closes the photo. A swipe may end in a click on the popup, which would close the photo, so the
 * returned `onClick` lets that one by and passes the others to `onClick`.
 */
function useStepGestures(
  navigate: (step: Step) => void,
  close: () => void,
  onClick: (event: MouseEvent) => void,
) {
  // A swipe in progress, and whether one just stepped.
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null)
  const swiped = useRef(false)
  return {
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') navigate(1)
      else if (event.key === 'ArrowLeft') navigate(-1)
    },
    onPointerDown: (event: PointerEvent) => {
      // A swipe needn't end in a click (browsers don't send one after a move), so the flag goes
      // with the next touch rather than swallowing its tap.
      swiped.current = false
      swipe.current =
        event.pointerType === 'mouse'
          ? null
          : { id: event.pointerId, x: event.clientX, y: event.clientY }
    },
    onPointerUp: (event: PointerEvent) => {
      const start = swipe.current
      swipe.current = null
      if (!start || start.id !== event.pointerId) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (dy >= 60 && dy >= 1.5 * Math.abs(dx)) {
        swiped.current = true
        close()
        return
      }
      if (Math.abs(dx) < 40 || Math.abs(dx) < 1.5 * Math.abs(dy)) return
      // Swiping left brings in the next photo from the right.
      swiped.current = true
      navigate(dx < 0 ? 1 : -1)
    },
    onClick: (event: MouseEvent) => {
      if (swiped.current) swiped.current = false
      else onClick(event)
    },
  }
}

/**
 * The photos on screen, the current one last and on top (`data-current`), each in a rounded frame
 * of its own at its full-screen rect (`rectOf`), which its slide and blur stay inside. Photos of
 * the same shape share a rect, so a step between them happens in one frame; a portrait and a
 * landscape one crossfade where each sits.
 */
function PhotoLayers({
  layers,
  imageRef,
  rectOf,
  tuning,
  transition,
}: {
  layers: readonly Layer[]
  imageRef: RefObject<HTMLImageElement | null>
  rectOf: (photo: GalleryPhoto) => Rect
  tuning: Pick<GalleryTuning['navigate'], 'shift' | 'blur'>
  transition: { duration: number; easing: string }
}) {
  return layers.map((layer, index) => {
    const current = index === layers.length - 1
    const motion = layerMotion(layer, tuning, transition)
    const rect = rectOf(layer.photo)
    return (
      <div
        key={layer.key}
        className="absolute isolate overflow-hidden rounded-xl"
        style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      >
        <img
          ref={current ? imageRef : undefined}
          data-current={current || undefined}
          src={layer.photo.large}
          srcSet={`${layer.photo.small} 640w, ${layer.photo.large} 1600w`}
          sizes={`${Math.round(rect.width)}px`}
          alt=""
          width={layer.photo.width}
          height={layer.photo.height}
          decoding="async"
          className={cn(
            // Its transition is inline (layerMotion), so reduced motion needs the important flag to win.
            'size-full bg-neutral-200 object-cover motion-reduce:transition-none! dark:bg-neutral-800',
            motion.className,
          )}
          style={motion.style}
        />
      </div>
    )
  })
}

/**
 * The arrows either side of the open photo, level with the middle of the room the photos take,
 * `side` in from the edges, in static glass at the floating size. Each hides at its end of the set.
 * The flight canvas draws above the dialog, so they wait for the photo to land, as the overlay's
 * close button does.
 */
function LightboxArrows({
  middle,
  side,
  canStep,
  onStep,
}: {
  middle: number
  side: number
  canStep: (step: Step) => boolean
  onStep: (step: Step) => void
}) {
  const arrows = ([-1, 1] as const).map((step) => (
    <div
      key={step}
      className={cn(
        // Not on a touch screen, which swipes between photos instead.
        'fixed -translate-y-1/2 transition-[opacity,scale] duration-300 ease-out pointer-coarse:hidden',
        !canStep(step) &&
          'pointer-events-none scale-90 opacity-0 duration-150 motion-reduce:scale-100',
      )}
      style={{ top: middle, [step < 0 ? 'left' : 'right']: side }}
    >
      <IconButton
        aria-label={step < 0 ? 'Previous photo' : 'Next photo'}
        size="4xl"
        glass="static"
        data-step={step}
        disabled={!canStep(step)}
        onClick={() => onStep(step)}
      >
        {step < 0 ? (
          <IconChevronLeft aria-hidden="true" />
        ) : (
          <IconChevronRight aria-hidden="true" />
        )}
      </IconButton>
    </div>
  ))
  return arrows
}

/** Each photo of the set's readout's widths, from the unseen ReadoutMeasures in `container`. */
const measureReadouts = (container: Element | null) =>
  container ? Array.from(container.children, (readout) => measureReadout(readout)) : []

/** The open photo, crossfading with the last one after a step, the readout under it, and the arrows. */
function OpenPhotoView({
  shown,
  layout,
  tuning,
  fades,
  imageRef,
  readoutRef,
  measuresRef,
  canStep,
  onStep,
}: {
  shown: Shown
  layout: ReturnType<typeof fullScreenLayout>
  tuning: Pick<GalleryTuning, 'expand' | 'readout' | 'navigate'>
  /** Without the flight renderer the photo fades in by itself. */
  fades: boolean
  imageRef: RefObject<HTMLImageElement | null>
  readoutRef: RefObject<HTMLDListElement | null>
  measuresRef: RefObject<HTMLDivElement | null>
  canStep: (step: Step) => boolean
  onStep: (step: Step) => void
}) {
  const { motion } = tuning.navigate
  const layerTransition = useMemo(() => cssSpring(motion), [motion])
  // Each glyph of the readout rolls on Scritto's bouncy spring, over the photos' crossfade.
  const roll = useMemo(() => ({ duration: Math.round(springResponse(motion) * 1000) }), [motion])
  const { photo, phase } = shown
  return (
    <>
      <Dialog.Title className="sr-only">{photo.alt}</Dialog.Title>
      <div
        className={cn(
          'pointer-events-none fixed inset-0',
          phase !== 'open' && 'opacity-0',
          fades &&
            'transition-[opacity,scale] duration-300 ease-out motion-reduce:transition-none starting:scale-95 starting:opacity-0',
        )}
      >
        <PhotoLayers
          layers={shown.layers}
          imageRef={imageRef}
          rectOf={layout.rectOf}
          tuning={tuning.navigate}
          transition={layerTransition}
        />
      </div>
      <ExposureReadout
        ref={readoutRef}
        photo={photo}
        row={layout.readout}
        // Up once the photo takes off or opens without a flight; gone as it closes.
        shown={(shown.airborne || phase === 'open') && phase !== 'closing'}
        delay={readoutDelay(phase, tuning)}
        tuning={tuning.readout}
        trend={shown.trend}
        roll={roll}
        slots={shown.slots}
      />
      {shown.readouts.length === 0 && <ReadoutMeasures ref={measuresRef} photos={shown.set} />}
      {shown.set.length > 1 && (
        <LightboxArrows
          middle={layout.middle}
          side={layout.side}
          canStep={canStep}
          onStep={onStep}
        />
      )}
    </>
  )
}

/**
 * Opens a featured photo full screen. Where WebGPU runs, the photo lifts out of its tile and
 * expands corner by corner, each on its own spring (src/lib/gallery-flight.ts): the corner
 * farthest from its corner of the viewport leads on the quickest spring, and each other one
 * follows on a slower one by how much shorter its way is (cornerLags). Closing flies it back
 * into its tile the other way round, as Apple's app close does: the corner nearest its place lands
 * first and the far side trails in. A close while the open is under way turns the corners around
 * with their speed. Without WebGPU the photo fades in and out.
 *
 * Once open, static glass arrows at either side, the arrow keys and a swipe step to the next or previous
 * photo of the set it opened from (on a touch screen, a swipe only, and a swipe down closes it). The photos crossfade through a blur, each sliding a little the
 * way the step goes inside its rounded frame: one frame between photos of the same shape, each
 * its own between a portrait and a landscape one, which don't resize. The readout
 * under it keeps its width and rolls its values over. The step hands the photo's place to the new
 * one's tile, which the close flies back into.
 *
 * Flies on the Gallery's shared `stage` (src/components/gallery-flight-stage.tsx). Returns
 * `openPhoto` for the featured tiles and the See more grid, and the dialog to render. Render it
 * inside the See more dialog's root, so a photo opened from its grid nests in it and closes back
 * to the grid.
 */
export function useGalleryLightbox(
  stage: FlightStage,
  tuning: Pick<GalleryTuning, 'expand' | 'readout' | 'navigate'>,
) {
  const imageRef = useRef<HTMLImageElement>(null)
  const readoutRef = useRef<HTMLDListElement>(null)
  const measuresRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<Shown | null>(null)
  // Bumped by every open and close, so a step still waiting on an earlier one can tell it's stale.
  const flightToken = useRef(0)
  // Keys the photo layers.
  const layerKey = useRef(0)
  // Where focus goes back to on close: the tile the photo came out of, shown as keyboard focus only
  // if a key opened it. Base UI would hand it to the See more tile, the outer dialog's trigger,
  // where keyboard focus zooms its grid out.
  const returnTo = useRef<{ tile: HTMLElement; keyboard: boolean } | null>(null)
  const viewport = useViewport(shown !== null)
  const { flightRef } = stage
  const { navigate: navigation } = tuning
  // A leaving photo goes once the new one has come up over it.
  const leavingFor = useMemo(() => cssSpring(navigation.motion).duration, [navigation.motion])

  // The photo has lifted out of its tile or grid cell while the flight or the full-screen view
  // shows it: `data-lifted` hides the tile (data-lifted:invisible), before paint, in the commit
  // that shows the canvas.
  const lifted = shown?.airborne ? shown.tile : null
  useLayoutEffect(() => {
    lifted?.setAttribute('data-lifted', '')
    return () => lifted?.removeAttribute('data-lifted')
  }, [lifted])

  /** Warms up the sharp photos either side of `index`, so a step shows them straight away. */
  const warmNeighbours = (set: readonly GalleryPhoto[], index: number) => {
    for (const near of [set[index + 1], set[index - 1]])
      if (near) decodedImage(near.large).catch(() => {})
  }

  const openPhoto: OpenPhotoIn = (photo, tile, keyboard, set) => {
    returnTo.current = { tile, keyboard }
    const flight = flightRef.current
    const token = ++flightToken.current
    const opened: Shown = {
      photo,
      tile,
      phase: flight ? 'opening' : 'open',
      airborne: false,
      set,
      readouts: [],
      slots: [],
      layers: [{ key: ++layerKey.current, photo, step: 0 }],
      trend: 1,
    }
    // Render every photo's readout first, unseen, to measure the bar and its lines, which the
    // photo's full-screen rect, and so the flight's landing, leaves room for.
    flushSync(() => setShown(opened))
    const { readouts, slots } = readoutSlots(
      measureReadouts(measuresRef.current),
      exposureReadouts(photo.exposure).length,
    )
    setShown({ ...opened, readouts, slots })
    warmNeighbours(set, set.indexOf(photo))
    if (!flight) return
    const from = tilePose(photo, tile, tile.getBoundingClientRect())
    const screen = viewportRect()
    const current = () => flightToken.current === token
    // The full-screen photo takes over from the flight, or replaces it if it fails.
    const settle = () => {
      if (!current()) return
      setShown((shown) => (shown ? { ...shown, phase: 'open' } : shown))
      stage.hide(false)
    }
    // The sharp photo if hovering already decoded it; otherwise the tile's own, until the sharp one
    // decodes, which starts now and takes over mid-flight.
    const image = decodedNow(photo.large) ?? decodedNow(photo.small)
    const sharp = decodedImage(photo.large)
    sharp.catch(() => {})
    const photoReady = image ? Promise.resolve(image) : decodedImage(photo.small)
    photoReady
      .then((photoImage) => {
        // Closed before the photo was ready: it never takes off.
        if (!current()) return false
        const landing = flight.fly({
          photo: photoImage,
          from,
          to: fullScreenPose(screen, photo, set, readouts),
          // The corner with the longest way to its side of the screen leads.
          lags: cornerLags(from.corners, quadOf(screen), diagonal(screen)),
          direction: 'open',
        })
        setShown((shown) => (shown && current() ? { ...shown, airborne: true } : shown))
        stage.show()
        sharp
          .then((sharpImage) => {
            if (current()) flight.sharpen(photoImage, sharpImage)
          })
          .catch(() => {})
        return landing
      })
      .then(async (landed) => {
        if (!landed) return
        // Keep the flight's last frame up until the full-screen photo can replace it, then swap
        // them in one commit.
        await imageRef.current?.decode().catch(() => {})
        settle()
      })
      .catch((error) => {
        console.warn('The Gallery photo opened without its expand:', error)
        settle()
      })
  }

  const canStep = (step: Step) => stepFrom(shown, step) !== null

  /** Steps to the next or previous photo of the set, once the open has landed. */
  const navigate = (step: Step) => {
    const next = stepFrom(shown, step)
    if (!shown || !next) return
    const { photo, tile, index } = next
    play('select', { emphasis: 'subtle', direction: step > 0 ? 'forward' : 'back' })
    // Behind the backdrop, so the close flies home to a tile on screen.
    revealReceded(tile)
    fadeHandOff(shown.tile, tile)
    if (returnTo.current) returnTo.current = { ...returnTo.current, tile }
    // An arrow that has run out of photos lets go of focus to the popup, which keeps the keys.
    if (!shown.set[index + step] && document.activeElement?.matches('[data-step]'))
      popupRef.current?.focus({ preventScroll: true })
    const key = ++layerKey.current
    setShown({
      ...shown,
      photo,
      tile,
      trend: step,
      layers: steppedLayers(shown.layers, photo, step, key),
    })
    // Clear the layers that have left once their move is over.
    window.setTimeout(
      () => setShown((now) => now && { ...now, layers: settledLayers(now.layers, key) }),
      leavingFor * 1000 + 50,
    )
    warmNeighbours(shown.set, index)
  }

  const requestClose = () => {
    if (!shown || shown.phase === 'closing') return
    // Escape or a click beside the photo: no control to bind, so the close plays from here.
    play('close')
    const flight = flightRef.current
    const { photo, tile } = shown
    const token = ++flightToken.current
    // The photo the open flew, or the sharp one if the full-screen view has loaded it since.
    const image = decodedNow(photo.large) ?? decodedNow(photo.small)
    // Without the renderer, or before the photo took off, there is nothing to fly back.
    if (!flight || !image || !shown.airborne) {
      setShown(null)
      return
    }
    const screen = viewportRect()
    // A photo still flying out turns around where it is instead (Flight.fly).
    const from = fullScreenPose(screen, photo, shown.set, shown.readouts)
    // Where the tile will be once the page behind the photo has grown back.
    const to = tilePose(photo, tile, fullScaleRect(tile))
    const landing = flight.fly({
      photo: image,
      from,
      to,
      // The corner nearest its place in the tile lands first, and the far side trails in.
      lags: cornerLags(from.corners, to.corners, diagonal(screen), 'nearest'),
      direction: 'close',
    })
    setShown({ ...shown, phase: 'closing', airborne: true })
    stage.show()
    // Landed or not (a lost device ends the flight early), the dialog closes.
    const close = (landed: boolean) => {
      if (flightToken.current !== token) return
      setShown(null)
      // A landed photo fades into its lit tile; one cut short by a failure just goes.
      stage.hide(landed)
    }
    landing.then(close, () => close(false))
  }

  const layout = shown && fullScreenLayout(viewport, shown.photo, shown.set, shown.readouts)
  // Without the flight renderer the photo fades in by itself.
  const fades = !stage.ready
  const gestures = useStepGestures(navigate, requestClose, (event) => {
    // Not while the photo is still flying out: a second click where it was would turn it
    // straight back. Escape still can.
    if (shown?.phase === 'opening') return
    if (event.target === event.currentTarget) requestClose()
  })

  const element = (
    <Dialog.Root
      open={shown !== null}
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
    >
      {/* Portalled to the body at z-50, so it covers the Sunlit light and the blind wand. */}
      <Dialog.Portal>
        {/* Nested in the See more dialog, which Base UI would leave without a backdrop. */}
        <Dialog.Backdrop forceRender className={galleryBackdropClass}>
          <GalleryBackdropFill closing={shown?.phase === 'closing'} />
        </Dialog.Backdrop>
        <Dialog.Popup
          ref={popupRef}
          // The popup, not its first tabbable element: that's an arrow or the recipe's link,
          // hidden until the photo lands.
          initialFocus={popupRef}
          finalFocus={() => returnFocus(returnTo.current)}
          // Fixed and viewport-sized, so Safari bands its toolbar in the page's colour: the
          // backdrop stops at the bars (src/lib/dialog-layer.ts), and the band hides what
          // would show there unblurred.
          // TODO: Blur under Safari's bars on touch screens: an absolute backdrop fill in the
          // page's flow at the locked scroll (scrollY - 5rem, 100lvh + 10rem tall), as React
          // Aria's underlay does (adobe/react-spectrum#8888), with this popup inset from the
          // edges so it no longer bands them. Untested in the simulator.
          // No panning, only pinching: a pan would cancel the swipes (useStepGestures).
          className="fixed inset-0 z-50 cursor-zoom-out [touch-action:pinch-zoom] outline-none data-ending-style:opacity-0 data-ending-style:transition-opacity data-ending-style:duration-200 motion-reduce:transition-none"
          {...gestures}
        >
          {shown && layout && (
            <OpenPhotoView
              shown={shown}
              layout={layout}
              tuning={tuning}
              fades={fades}
              imageRef={imageRef}
              readoutRef={readoutRef}
              measuresRef={measuresRef}
              canStep={canStep}
              onStep={navigate}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )

  return {
    openPhoto,
    element,
    /** The tile or cell of the photo open or opening, until its close starts. */
    holdingTile: shown && shown.phase !== 'closing' ? shown.tile : null,
  }
}
