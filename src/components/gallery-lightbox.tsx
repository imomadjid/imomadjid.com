import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'

import { IconButton } from '#/components/ui/icon-button'
import { useGalleryRenderer } from '#/components/use-gallery-renderer'
import type { GalleryPhoto } from '#/lib/gallery'
import type { Flight, FlightPose, FlightTuning } from '#/lib/gallery-flight'
import {
  containRect,
  cornerOrder,
  coverCrop,
  quadOf,
  wholeImage,
} from '#/lib/gallery-flight-geometry'
import type { Rect } from '#/lib/gallery-flight-geometry'
import { decodedImage, decodedNow } from '#/lib/gallery-images'
import { cn } from '#/lib/utils'

type Phase = 'opening' | 'open' | 'closing'

type Shown = {
  photo: GalleryPhoto
  /** The tile the photo lifts out of and lands back in. */
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

// The body to portal into, once hydrated.
const clientBody = () => document.body
const serverBody = () => null

/** The canvas the flight is drawn on, over the whole viewport. */
function FlightCanvas({
  ref,
  body,
  visible,
}: {
  ref: RefObject<HTMLCanvasElement | null>
  body: HTMLElement
  visible: boolean
}) {
  return createPortal(
    // Above the dialog (z-50) and below tooltips (z-70); it never takes the pointer.
    <canvas
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none fixed inset-0 z-60 size-full', !visible && 'invisible')}
    />,
    body,
  )
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

/** The whole photo in its full-screen rect. */
function fullScreenPose(viewport: Rect, photo: GalleryPhoto): FlightPose {
  return { corners: quadOf(fullScreenRect(viewport, photo)), texels: quadOf(wholeImage) }
}

/** A photo filling its tile, as object-fit: cover shows it. */
function tilePose(photo: GalleryPhoto, tile: DOMRect): FlightPose {
  return {
    corners: quadOf(tile),
    texels: quadOf(coverCrop(photo.width / photo.height, tile.width / tile.height)),
  }
}

/**
 * Opens a featured photo full screen. Where WebGPU runs, the photo lifts out of its tile and
 * expands one corner at a time (src/lib/gallery-flight.ts): the corner farthest from its corner
 * of the viewport moves first, then the others by falling distance. Closing flies it back the
 * same way, the corner farthest from its place in the tile first. Without WebGPU the photo fades
 * in and out.
 *
 * Returns `openPhoto` for the tiles, the photo currently lifted out of its tile, and the elements
 * to render: the dialog, and the canvas the flight is drawn on, above it.
 */
export function useGalleryLightbox(tuning: FlightTuning, nearRef: RefObject<Element | null>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [shown, setShown] = useState<Shown | null>(null)
  // Bumped by every open and close, so a step still waiting on an earlier one can tell it's stale.
  const flightToken = useRef(0)
  const viewport = useViewport(shown !== null)
  const body = useSyncExternalStore(subscribeNever, clientBody, serverBody)

  const { rendererRef: flightRef, ready } = useGalleryRenderer<Flight, FlightTuning>(
    canvasRef,
    // The canvas only exists once hydrated, in a portal.
    body ? 'flight' : 'server',
    tuning,
    async (canvas, initialTuning, signal, onFail) => {
      const { startGalleryFlight } = await import('#/lib/gallery-flight')
      return startGalleryFlight(canvas, initialTuning, signal, onFail)
    },
    nearRef,
  )

  // The canvas shows the photo only while it flies. The full-screen photo or the tile takes over
  // in the same commit that hides it; then the flight's last frame can go.
  const flying = shown !== null && shown.airborne && shown.phase !== 'open'
  useEffect(() => {
    if (!flying) flightRef.current?.clear()
  }, [flying, flightRef])

  const openPhoto = (photo: GalleryPhoto, tile: HTMLElement) => {
    const flight = flightRef.current
    const token = ++flightToken.current
    setShown({ photo, tile, phase: flight ? 'opening' : 'open', airborne: false })
    if (!flight) return
    const tileRect = tile.getBoundingClientRect()
    const screen = readViewport()
    const current = () => flightToken.current === token
    // The sharp photo if hovering already decoded it; otherwise the tile's own, swapped on landing.
    const image = decodedNow(photo.large) ?? decodedNow(photo.small)
    const photoReady = image ? Promise.resolve(image) : decodedImage(photo.small)
    photoReady
      .then((photoImage) => {
        // Closed before the photo was ready: it never takes off.
        if (!current()) return false
        const from = tilePose(photo, tileRect)
        const landing = flight.fly({
          photo: photoImage,
          from,
          to: fullScreenPose(screen, photo),
          // The corner with the longest way to its side of the screen leads.
          order: cornerOrder(from.corners, quadOf(screen)),
        })
        setShown((shown) => (shown && current() ? { ...shown, airborne: true } : shown))
        return landing
      })
      .then(async (landed) => {
        if (!landed) return
        // Keep the flight's last frame up until the full-screen photo can replace it.
        await imageRef.current?.decode().catch(() => {})
        setShown((shown) => (shown && current() ? { ...shown, phase: 'open' } : shown))
      })
      .catch((error) => {
        console.warn('The Gallery photo opened without its expand:', error)
        setShown((shown) => (shown && current() ? { ...shown, phase: 'open' } : shown))
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
    const from = flight.pose() ?? fullScreenPose(readViewport(), photo)
    const to = tilePose(photo, tile.getBoundingClientRect())
    const landing = flight.fly({
      photo: image,
      from,
      to,
      // The corner farthest from its place in the tile leads.
      order: cornerOrder(from.corners, to.corners),
    })
    setShown({ ...shown, phase: 'closing', airborne: true })
    // Landed or not (a lost device ends the flight early), the dialog closes.
    const close = () => {
      if (flightToken.current === token) setShown(null)
    }
    landing.then(close, close)
  }

  const photo = shown?.photo
  const target = photo ? fullScreenRect(viewport, photo) : null
  // Without the flight renderer the photo fades in by itself.
  const fades = !ready

  const element = (
    <>
      <Dialog.Root
        open={shown !== null}
        onOpenChange={(open) => {
          if (!open) requestClose()
        }}
      >
        {/* Portalled to the body at z-50, so it covers the Sunlit light and the blind wand. */}
        <Dialog.Portal>
          <Dialog.Backdrop
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
      {body && <FlightCanvas ref={canvasRef} body={body} visible={flying} />}
    </>
  )

  return { openPhoto, liftedId: shown?.airborne ? shown.photo.id : null, element }
}
