import { Dialog } from '@base-ui/react/dialog'
import { play } from 'cuelume'
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

import { ExposureReadout, measureReadout } from '#/components/gallery-exposure'
import type { FlightStage } from '#/components/gallery-flight-stage'
import type { OpenPhoto } from '#/components/gallery-photo-tile'
import { dialogCoverClass } from '#/lib/dialog-layer'
import { springResponse } from '#/lib/flight-springs'
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
import { fullScaleRect } from '#/lib/page-recede'
import { readoutRow, readoutSpace } from '#/lib/readout-layout'
import { TILE_RADIUS } from '#/lib/see-more-grid'
import { cn } from '#/lib/utils'

type Phase = 'opening' | 'open' | 'closing'

type Shown = {
  photo: GalleryPhoto
  /** The tile or grid cell the photo lifts out of and lands back in. */
  tile: HTMLElement
  phase: Phase
  /** True once the flight canvas has drawn the photo, so the tile can let go of it. */
  airborne: boolean
  /** The readout's items' widths, which set how many lines it needs; empty until measured. */
  readoutWidths: readonly number[]
}

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
 * doesn't take the backdrop for a dimming layer (src/lib/dialog-layer.ts).
 */
export const galleryBackdropClass = cn(
  dialogCoverClass,
  'z-50 transition-opacity duration-300 ease-out data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 motion-reduce:transition-none',
)

// On touch screens Safari bands its bars in the page's colour over a blurred backdrop
// (src/lib/dialog-layer.ts), which leaves a seam where the blur shows darker photos. A strip of
// that colour at each edge, fading into the blur, makes the band read as part of it.
const edgeFadeClass =
  'pointer-events-none fixed inset-x-0 hidden h-3 bg-surface-1 pointer-coarse:block after:absolute after:inset-x-0 after:h-12 after:from-surface-1 after:to-transparent'

/** The Gallery backdrop's colour and blur, in its Dialog.Backdrop (galleryBackdropClass). */
export function GalleryBackdropFill() {
  return (
    <>
      <span className="absolute inset-0 bg-surface-1/60 backdrop-blur-md" />
      <span className={cn(edgeFadeClass, '-top-[7px] after:top-full after:bg-linear-to-b')} />
      <span className={cn(edgeFadeClass, '-bottom-[7px] after:bottom-full after:bg-linear-to-t')} />
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

/** The full-screen photo's margin from the viewport's edges. */
const screenMargin = (viewport: Rect) => (viewport.width < 640 ? 12 : 24)

/**
 * Where the full-screen photo sits, as large as fits an even margin from the edges and the room
 * its exposure readout's lines take under it, and the readout's row. The readout wraps only where
 * the viewport is too narrow for its line, so its lines are known before the photo is placed.
 */
function fullScreenLayout(viewport: Rect, photo: GalleryPhoto, readoutWidths: readonly number[]) {
  const side = screenMargin(viewport)
  const { lines } = readoutRow(viewport, side, readoutWidths)
  const rect = containRect(viewport, photo.width / photo.height, {
    top: side,
    right: side,
    bottom: side + readoutSpace(lines),
    left: side,
  })
  return { photo: rect, readout: readoutRow(viewport, side, readoutWidths, rect) }
}

/** The whole photo in its full-screen rect. */
function fullScreenPose(
  viewport: Rect,
  photo: GalleryPhoto,
  readoutWidths: readonly number[],
): FlightPose {
  return {
    corners: quadOf(fullScreenLayout(viewport, photo, readoutWidths).photo),
    texels: quadOf(wholeImage),
    radius: TILE_RADIUS,
  }
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
 * Opens a featured photo full screen. Where WebGPU runs, the photo lifts out of its tile and
 * expands corner by corner, each on its own spring (src/lib/gallery-flight.ts): the corner
 * farthest from its corner of the viewport leads on the quickest spring, and each other one
 * follows on a slower one by how much shorter its way is (cornerLags). Closing flies it back
 * into its tile the other way round, as Apple's app close does: the corner nearest its place lands
 * first and the far side trails in. A close while the open is under way turns the corners around
 * with their speed. Without WebGPU the photo fades in and out.
 *
 * Flies on the Gallery's shared `stage` (src/components/gallery-flight-stage.tsx). Returns
 * `openPhoto` for the featured tiles and the See more grid, and the dialog to render. Render it
 * inside the See more dialog's root, so a photo opened from its grid nests in it and closes back
 * to the grid.
 */
export function useGalleryLightbox(
  stage: FlightStage,
  tuning: Pick<GalleryTuning, 'expand' | 'readout'>,
) {
  const imageRef = useRef<HTMLImageElement>(null)
  const readoutRef = useRef<HTMLDListElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<Shown | null>(null)
  // Bumped by every open and close, so a step still waiting on an earlier one can tell it's stale.
  const flightToken = useRef(0)
  // Where focus goes back to on close: the tile the photo came out of, shown as keyboard focus only
  // if a key opened it. Base UI would hand it to the See more tile, the outer dialog's trigger,
  // where keyboard focus zooms its grid out.
  const returnTo = useRef<{ tile: HTMLElement; keyboard: boolean } | null>(null)
  const viewport = useViewport(shown !== null)
  const { flightRef } = stage

  // The photo has lifted out of its tile or grid cell while the flight or the full-screen view
  // shows it: `data-lifted` hides the tile (data-lifted:invisible), before paint, in the commit
  // that shows the canvas.
  const lifted = shown?.airborne ? shown.tile : null
  useLayoutEffect(() => {
    lifted?.setAttribute('data-lifted', '')
    return () => lifted?.removeAttribute('data-lifted')
  }, [lifted])

  const openPhoto: OpenPhoto = (photo, tile, keyboard) => {
    returnTo.current = { tile, keyboard }
    const flight = flightRef.current
    const token = ++flightToken.current
    const opened: Shown = {
      photo,
      tile,
      phase: flight ? 'opening' : 'open',
      airborne: false,
      readoutWidths: [],
    }
    // Render the readout first, hidden, to measure how many lines it takes, which the photo's
    // full-screen rect, and so the flight's landing, leaves room for.
    flushSync(() => setShown(opened))
    const readoutWidths = readoutRef.current ? measureReadout(readoutRef.current) : []
    setShown({ ...opened, readoutWidths })
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
          to: fullScreenPose(screen, photo, readoutWidths),
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

  const requestClose = () => {
    if (!shown || shown.phase === 'closing') return
    // Escape or a click beside the photo: no control to bind, so the close plays from here.
    play('close')
    const flight = flightRef.current
    const { photo, tile, readoutWidths } = shown
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
    const from = fullScreenPose(screen, photo, readoutWidths)
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

  const photo = shown?.photo
  const layout = photo ? fullScreenLayout(viewport, photo, shown.readoutWidths) : null
  // Without the flight renderer the photo fades in by itself.
  const fades = !stage.ready

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
        <Dialog.Backdrop
          forceRender
          className={cn(galleryBackdropClass, shown?.phase === 'closing' && 'opacity-0')}
        >
          <GalleryBackdropFill />
        </Dialog.Backdrop>
        <Dialog.Popup
          ref={popupRef}
          // The popup, not its first tabbable element: that's the recipe's link, hidden until
          // the readout comes up.
          initialFocus={popupRef}
          finalFocus={() => returnFocus(returnTo.current)}
          // Fixed and viewport-sized, so Safari bands its toolbar in the page's colour: the
          // backdrop stops at the bars (src/lib/dialog-layer.ts), and the band hides what
          // would show there unblurred.
          // TODO: Blur under Safari's bars on touch screens: an absolute backdrop fill in the
          // page's flow at the locked scroll (scrollY - 5rem, 100lvh + 10rem tall), as React
          // Aria's underlay does (adobe/react-spectrum#8888), with this popup inset from the
          // edges so it no longer bands them. Untested in the simulator.
          className="fixed inset-0 z-50 cursor-zoom-out outline-none data-ending-style:opacity-0 data-ending-style:transition-opacity data-ending-style:duration-200 motion-reduce:transition-none"
          onClick={(event) => {
            // Not while the photo is still flying out: a second click where it was would turn it
            // straight back. Escape still can.
            if (shown?.phase === 'opening') return
            if (event.target === event.currentTarget) requestClose()
          }}
        >
          {photo && layout && (
            <>
              <Dialog.Title className="sr-only">{photo.alt}</Dialog.Title>
              <img
                ref={imageRef}
                src={photo.large}
                srcSet={`${photo.small} 640w, ${photo.large} 1600w`}
                sizes={`${Math.round(layout.photo.width)}px`}
                alt=""
                width={photo.width}
                height={photo.height}
                decoding="async"
                className={cn(
                  'pointer-events-none fixed rounded-xl bg-neutral-200 dark:bg-neutral-800',
                  shown.phase !== 'open' && 'opacity-0',
                  fades &&
                    'transition-[opacity,scale] duration-300 ease-out motion-reduce:transition-none starting:scale-95 starting:opacity-0',
                )}
                style={{
                  left: layout.photo.x,
                  top: layout.photo.y,
                  width: layout.photo.width,
                  height: layout.photo.height,
                }}
              />
              <ExposureReadout
                ref={readoutRef}
                photo={photo}
                row={layout.readout}
                // Up once the photo takes off or opens without a flight; gone as it closes.
                shown={(shown.airborne || shown.phase === 'open') && shown.phase !== 'closing'}
                // Flying, it waits `readout.start` of the open's response: it comes up while the
                // photo settles, so the two overlap rather than run one after the other.
                delay={
                  shown.phase === 'opening'
                    ? springResponse(tuning.expand.open) * tuning.readout.start
                    : 0
                }
                tuning={tuning.readout}
              />
            </>
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
