import { Dialog } from '@base-ui/react/dialog'
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

import { ExposureReadout, readoutSpace } from '#/components/gallery-exposure'
import type { FlightStage } from '#/components/gallery-flight-stage'
import type { OpenPhoto } from '#/components/gallery-photo-tile'
import { springOf } from '#/lib/flight-springs'
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
import { playRelease, playShutter } from '#/lib/gallery-sounds'
import { fullScaleRect } from '#/lib/page-recede'
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
  /** True once the exposure readout comes up: before the photo lands, so the two overlap. */
  readout: boolean
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

/** The backdrop both Gallery dialogs dim the page with, thin enough for the page's shrink to show. */
export const galleryBackdropClass =
  'fixed inset-0 z-50 bg-surface-1/60 backdrop-blur-md transition-opacity duration-300 ease-out data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 motion-reduce:transition-none'

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
 * Where the full-screen photo sits: as large as fits, an even margin from the edges, and room
 * under it for its exposure readout.
 */
function fullScreenRect(viewport: Rect, photo: GalleryPhoto): Rect {
  const side = screenMargin(viewport)
  return containRect(viewport, photo.width / photo.height, {
    top: side,
    right: side,
    bottom: side + readoutSpace(viewport.width),
    left: side,
  })
}

/** The whole photo in its full-screen rect. */
function fullScreenPose(viewport: Rect, photo: GalleryPhoto): FlightPose {
  return {
    corners: quadOf(fullScreenRect(viewport, photo)),
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
    playShutter(photo.exposure.shutter)
    const flight = flightRef.current
    const token = ++flightToken.current
    setShown({ photo, tile, phase: flight ? 'opening' : 'open', airborne: false, readout: !flight })
    if (!flight) return
    const from = tilePose(photo, tile, tile.getBoundingClientRect())
    const screen = viewportRect()
    const current = () => flightToken.current === token
    // The full-screen photo takes over from the flight, or replaces it if it fails.
    const settle = () => {
      if (!current()) return
      setShown((shown) => (shown ? { ...shown, phase: 'open', readout: true } : shown))
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
          to: fullScreenPose(screen, photo),
          // The corner with the longest way to its side of the screen leads.
          lags: cornerLags(from.corners, quadOf(screen), diagonal(screen)),
          direction: 'open',
        })
        setShown((shown) => (shown && current() ? { ...shown, airborne: true } : shown))
        stage.show()
        // The readout comes up while the photo settles, not once it has.
        const response = (2 * Math.PI) / springOf(tuning.expand.open).omega
        window.setTimeout(
          () => {
            if (current()) setShown((shown) => (shown ? { ...shown, readout: true } : shown))
          },
          response * tuning.readout.start * 1000,
        )
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
    playRelease()
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
    const from = fullScreenPose(screen, photo)
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
  const target = photo ? fullScreenRect(viewport, photo) : null
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
        />
        <Dialog.Popup
          finalFocus={() => returnFocus(returnTo.current)}
          className="fixed inset-0 z-50 cursor-zoom-out outline-none data-ending-style:opacity-0 data-ending-style:transition-opacity data-ending-style:duration-200 motion-reduce:transition-none"
          onClick={(event) => {
            // Not while the photo is still flying out: a second click where it was would turn it
            // straight back. Escape still can.
            if (shown?.phase === 'opening') return
            if (event.target === event.currentTarget) requestClose()
          }}
        >
          {photo && target && (
            <>
              <Dialog.Title className="sr-only">{photo.alt}</Dialog.Title>
              <img
                ref={imageRef}
                src={photo.large}
                srcSet={`${photo.small} 640w, ${photo.large} 1600w`}
                sizes={`${Math.round(target.width)}px`}
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
                  left: target.x,
                  top: target.y,
                  width: target.width,
                  height: target.height,
                }}
              />
              <ExposureReadout
                photo={photo}
                rect={target}
                shown={shown.readout && shown.phase !== 'closing'}
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
