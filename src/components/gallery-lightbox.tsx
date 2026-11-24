import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { useHydrated } from '@tanstack/react-router'
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

// How long the flight's last frame stays over the full-screen photo or the tile once they show.
const HOLD_FRAMES = 3
const HOLD_MS = 80

type Shown = {
  photo: GalleryPhoto
  /** The tile the photo lifts out of and lands back in. */
  tile: HTMLElement
  phase: Phase
  /** True once the flight canvas has drawn the photo, so the tile can let go of it. */
  airborne: boolean
}

// The viewport as a string, so the store's snapshot is stable between changes.
function subscribeViewport(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}
const viewportSnapshot = () => `${document.documentElement.clientWidth} ${window.innerHeight}`
const serverViewport = () => '0 0'

function useViewport(): Rect {
  const [width = 0, height = 0] = useSyncExternalStore(
    subscribeViewport,
    viewportSnapshot,
    serverViewport,
  )
    .split(' ')
    .map(Number)
  return { x: 0, y: 0, width, height }
}

const subscribeNever = () => () => {}
const clientBody = () => document.body
const serverBody = () => null

/** The canvas the flight is drawn on: over the whole viewport, once hydrated. */
function FlightCanvas({
  ref,
  flying,
}: {
  ref: RefObject<HTMLCanvasElement | null>
  flying: boolean
}) {
  const body = useSyncExternalStore(subscribeNever, clientBody, serverBody)
  if (!body) return null
  return createPortal(
    // Above the dialog (z-50) and below tooltips (z-70); it never takes the pointer.
    <canvas
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none fixed inset-0 z-60 size-full', !flying && 'invisible')}
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
  const hydrated = useHydrated()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const tuningRef = useRef(tuning)
  // The photo the flight last drew, which a close flies back.
  const flightImage = useRef<HTMLImageElement | null>(null)
  const [shown, setShown] = useState<Shown | null>(null)
  const viewport = useViewport()

  const { rendererRef: flightRef, ready } = useGalleryRenderer<Flight>(
    canvasRef,
    // The canvas only exists once hydrated, in a portal.
    hydrated ? 'flight' : 'server',
    async (canvas, signal, onFail) => {
      const { startGalleryFlight } = await import('#/lib/gallery-flight')
      return startGalleryFlight(canvas, tuningRef.current, signal, onFail)
    },
    nearRef,
  )

  useEffect(() => {
    tuningRef.current = tuning
    flightRef.current?.update(tuning)
  }, [tuning, flightRef])

  const flying = shown !== null && shown.airborne && shown.phase !== 'open'
  // The canvas stays up from the first flight frame until the photo beneath it has painted.
  const [holding, setHolding] = useState(false)
  // Once the full-screen photo or the tile shows it again, drop the flight's last frame. Hold it a
  // few frames and at least HOLD_MS first, so the browser has drawn the photo beneath it: taking
  // the canvas away sooner showed a frame of the photo half drawn.
  useEffect(() => {
    if (flying) return
    const shownAt = performance.now()
    let frames = 0
    let frameId = 0
    const wait = (now: number) => {
      frames += 1
      if (frames < HOLD_FRAMES || now - shownAt < HOLD_MS) {
        frameId = requestAnimationFrame(wait)
        return
      }
      flightRef.current?.clear()
      setHolding(false)
    }
    frameId = requestAnimationFrame(wait)
    return () => cancelAnimationFrame(frameId)
  }, [flying, flightRef])

  const openPhoto = (photo: GalleryPhoto, tile: HTMLElement) => {
    const flight = flightRef.current
    setShown({ photo, tile, phase: flight ? 'opening' : 'open', airborne: false })
    if (!flight) return
    const tileRect = tile.getBoundingClientRect()
    const screen: Rect = {
      x: 0,
      y: 0,
      width: canvasRef.current?.clientWidth ?? 0,
      height: canvasRef.current?.clientHeight ?? 0,
    }
    const target = fullScreenRect(screen, photo)
    const sameShown = (current: Shown | null) => current?.photo === photo && current.tile === tile
    // The sharp photo if hovering already decoded it; otherwise the tile's own, swapped on landing.
    const image = decodedNow(photo.large) ?? decodedNow(photo.small)
    const photoReady = image ? Promise.resolve(image) : decodedImage(photo.small)
    photoReady
      .then((photoImage) => {
        flightImage.current = photoImage
        const from = tilePose(photo, tileRect)
        const landing = flight.fly({
          photo: photoImage,
          from,
          to: { corners: quadOf(target), texels: quadOf(wholeImage) },
          // The corner with the longest way to its side of the screen leads.
          order: cornerOrder(from.corners, quadOf(screen)),
        })
        setShown((current) => (sameShown(current) ? { ...current!, airborne: true } : current))
        setHolding(true)
        return landing
      })
      .then(async (landed) => {
        if (!landed) return
        // Keep the flight's last frame up until the full-screen photo can replace it.
        await imageRef.current?.decode().catch(() => {})
        setShown((current) =>
          sameShown(current) && current!.phase === 'opening'
            ? { ...current!, phase: 'open' }
            : current,
        )
      })
      .catch((error) => {
        console.warn('The Gallery photo opened without its expand:', error)
        setShown((current) => (sameShown(current) ? { ...current!, phase: 'open' } : current))
      })
  }

  const requestClose = () => {
    if (!shown || shown.phase === 'closing') return
    const flight = flightRef.current
    const { photo, tile } = shown
    // Prefer the sharp photo for the way back, now that the full-screen view has loaded it.
    const image = decodedNow(photo.large) ?? flightImage.current
    if (!flight || !image) {
      setShown(null)
      return
    }
    const screen: Rect = {
      x: 0,
      y: 0,
      width: canvasRef.current?.clientWidth ?? 0,
      height: canvasRef.current?.clientHeight ?? 0,
    }
    const from: FlightPose = flight.pose() ?? {
      corners: quadOf(fullScreenRect(screen, photo)),
      texels: quadOf(wholeImage),
    }
    const to = tilePose(photo, tile.getBoundingClientRect())
    flightImage.current = image
    const landing = flight.fly({
      photo: image,
      from,
      to,
      // The corner farthest from its place in the tile leads.
      order: cornerOrder(from.corners, to.corners),
    })
    setShown({ ...shown, phase: 'closing', airborne: true })
    setHolding(true)
    landing
      .then((landed) => {
        if (landed)
          setShown((current) =>
            current?.photo === photo && current.phase === 'closing' ? null : current,
          )
      })
      .catch(() => setShown(null))
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
                  // Decoded before it shows, and painted with the frame that shows it.
                  decoding="sync"
                  className={cn(
                    'pointer-events-none fixed rounded-xl bg-neutral-200 dark:bg-neutral-800',
                    shown.phase !== 'open' && 'opacity-0',
                    // A browser skips drawing an invisible image, then draws it in tiles the frame
                    // it shows: one frame of it half drawn as the flight hands over. Its own layer,
                    // kept from the start of the flight until the dialog closes, has it drawn while
                    // it waits underneath, and nothing redraws it when the canvas lets go.
                    !fades && 'will-change-[opacity]',
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
      <FlightCanvas ref={canvasRef} flying={flying || holding} />
    </>
  )

  return { openPhoto, liftedId: shown?.airborne ? shown.photo.id : null, element }
}
