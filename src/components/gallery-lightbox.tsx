import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

import type { FlightStage } from '#/components/gallery-flight-stage'
import { IconButton } from '#/components/ui/icon-button'
import type { GalleryPhoto } from '#/lib/gallery'
import type { FlightPose } from '#/lib/gallery-flight'
import {
  containRect,
  cornerLags,
  coverCrop,
  diagonal,
  quadOf,
  wholeImage,
} from '#/lib/gallery-flight-geometry'
import type { Rect } from '#/lib/gallery-flight-geometry'
import { decodedImage, decodedNow } from '#/lib/gallery-images'
import { cn } from '#/lib/utils'

type Phase = 'opening' | 'open' | 'closing'

type Shown = {
  photo: GalleryPhoto
  /** The tile or grid cell the photo lifts out of and lands back in. */
  tile: HTMLElement
  phase: Phase
  /** True once the flight canvas has drawn the photo, so the tile can let go of it. */
  airborne: boolean
}

// The layout viewport without scrollbars: the box the fixed flight canvas fills. The flight and
// the full-screen photo both measure it here, so the photo lands where the image shows.
const readViewport = (): Rect => ({
  x: 0,
  y: 0,
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
})
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

/** Where the full-screen photo sits: as large as fits, clear of the close button. */
function fullScreenRect(viewport: Rect, photo: GalleryPhoto): Rect {
  const narrow = viewport.width < 640
  const side = narrow ? 12 : 24
  return containRect(viewport, photo.width / photo.height, {
    top: narrow ? 56 : 64,
    right: side,
    bottom: side,
    left: side,
  })
}

// The full-screen photo's rounded-xl corners.
const FULL_SCREEN_RADIUS = 12

/** The whole photo in its full-screen rect. */
function fullScreenPose(viewport: Rect, photo: GalleryPhoto): FlightPose {
  return {
    corners: quadOf(fullScreenRect(viewport, photo)),
    texels: quadOf(wholeImage),
    radius: FULL_SCREEN_RADIUS,
  }
}

/** A photo filling its tile, as object-fit: cover shows it, with the tile's own corners. */
function tilePose(photo: GalleryPhoto, tile: HTMLElement): FlightPose {
  const rect = tile.getBoundingClientRect()
  return {
    corners: quadOf(rect),
    texels: quadOf(coverCrop(photo.width / photo.height, rect.width / rect.height)),
    radius: Number.parseFloat(getComputedStyle(tile).borderTopLeftRadius) || 0,
  }
}

/**
 * Opens a featured photo full screen. Where WebGPU runs, the photo lifts out of its tile and
 * expands corner by corner, each on its own spring (src/lib/gallery-flight.ts): the corner
 * farthest from its corner of the viewport leads on the quickest spring, and each other one
 * follows by how much shorter its way is (cornerLags). Closing flies it back the same way, against
 * its place in the tile, turning around with its speed if the open is still under way. Without
 * WebGPU the photo fades in and out.
 *
 * Flies on the Gallery's shared `stage` (src/components/gallery-flight-stage.tsx). Returns
 * `openPhoto` for the featured tiles and the See more grid, and the dialog to render. Render it
 * inside the See more dialog's root, so a photo opened from its grid nests in it and closes back
 * to the grid.
 */
export function useGalleryLightbox(stage: FlightStage) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [shown, setShown] = useState<Shown | null>(null)
  // Bumped by every open and close, so a step still waiting on an earlier one can tell it's stale.
  const flightToken = useRef(0)
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

  const openPhoto = (photo: GalleryPhoto, tile: HTMLElement) => {
    const flight = flightRef.current
    const token = ++flightToken.current
    setShown({ photo, tile, phase: flight ? 'opening' : 'open', airborne: false })
    if (!flight) return
    const from = tilePose(photo, tile)
    const screen = readViewport()
    const current = () => flightToken.current === token
    // The sharp photo if hovering already decoded it; otherwise the tile's own, swapped on landing.
    const image = decodedNow(photo.large) ?? decodedNow(photo.small)
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
        return landing
      })
      .then(async (landed) => {
        if (!landed) return
        // Keep the flight's last frame up until the full-screen photo can replace it.
        await imageRef.current?.decode().catch(() => {})
        if (!current()) return
        // One commit: the full-screen photo shows as the canvas hides.
        setShown((shown) => (shown ? { ...shown, phase: 'open' } : shown))
        stage.hide(false)
      })
      .catch((error) => {
        console.warn('The Gallery photo opened without its expand:', error)
        if (!current()) return
        setShown((shown) => (shown ? { ...shown, phase: 'open' } : shown))
        stage.hide(false)
      })
  }

  const requestClose = () => {
    if (!shown || shown.phase === 'closing') return
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
    const screen = readViewport()
    const from = flight.pose() ?? fullScreenPose(screen, photo)
    const to = tilePose(photo, tile)
    const landing = flight.fly({
      photo: image,
      from,
      to,
      // The corner farthest from its place in the tile leads.
      lags: cornerLags(from.corners, to.corners, diagonal(screen)),
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
          className={cn(
            'fixed inset-0 z-50 bg-surface-1/85 backdrop-blur-2xl transition-opacity duration-300 ease-out data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 motion-reduce:transition-none',
            shown?.phase === 'closing' && 'opacity-0',
          )}
        />
        <Dialog.Popup
          className="fixed inset-0 z-50 cursor-zoom-out outline-none data-ending-style:opacity-0 data-ending-style:transition-opacity data-ending-style:duration-200 motion-reduce:transition-none"
          onClick={(event) => {
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
              <div className="fixed top-3 right-3 sm:top-4 sm:right-6">
                <Dialog.Close render={<IconButton aria-label="Close photo" />}>
                  <IconX size={18} stroke={1.75} aria-hidden="true" />
                </Dialog.Close>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )

  return { openPhoto, element }
}
