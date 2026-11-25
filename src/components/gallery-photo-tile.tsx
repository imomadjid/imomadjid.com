import { useEffect, useRef, useState } from 'react'
import type { FocusEvent as ReactFocusEvent, PointerEvent as ReactPointerEvent } from 'react'

import { useGalleryRenderer } from '#/components/use-gallery-renderer'
import { transitionTiming } from '#/lib/ambient-transition'
import type { GalleryPhoto } from '#/lib/gallery'
import { decodedImage } from '#/lib/gallery-images'
import type { PhotoZoom, PhotoZoomTuning } from '#/lib/gallery-photo-zoom'
import { TILE_RADIUS } from '#/lib/see-more-grid'
import { cn } from '#/lib/utils'

/** Opens `photo` full screen out of `tile`; `keyboard` if a key pressed it, not a pointer. */
export type OpenPhoto = (photo: GalleryPhoto, tile: HTMLElement, keyboard: boolean) => void

// The CSS fallback's hover zoom, left off while the canvas draws the photo.
const photoZoomClass =
  'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06] motion-reduce:transition-none'

/**
 * A photo that zooms in a little inside its frame on hover or keyboard focus, the middle first
 * (src/lib/gallery-photo-zoom.ts). Its renderer starts as it nears the viewport, or with `lazy`,
 * on hover or focus, and lets go of its canvas once the photo has zoomed back out, so a long list
 * only holds canvases for the photos being pointed at.
 */
function useZoomingPhoto({
  photo,
  tuning,
  radius,
  lazy,
}: {
  photo: GalleryPhoto
  tuning: PhotoZoomTuning
  radius: number
  lazy: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const zoomedInRef = useRef(false)
  const [active, setActive] = useState(!lazy)
  // Without WebGPU no canvas starts, so the CSS zoom stays.
  const [unsupported, setUnsupported] = useState(false)
  const releaseTimer = useRef(0)
  useEffect(() => () => clearTimeout(releaseTimer.current), [])

  const { rendererRef, ready, failed } = useGalleryRenderer<PhotoZoom, PhotoZoomTuning>(
    canvasRef,
    photo.small,
    tuning,
    async (canvas, initialTuning, signal, onFail) => {
      const { startPhotoZoom } = await import('#/lib/gallery-photo-zoom')
      const zoom = await startPhotoZoom(canvas, photo.small, initialTuning, signal, onFail, radius)
      zoom.setZoomedIn(zoomedInRef.current)
      return zoom
    },
    canvasRef,
    active,
  )

  const zoomIn = (zoomedIn: boolean) => {
    zoomedInRef.current = zoomedIn
    rendererRef.current?.setZoomedIn(zoomedIn)
    clearTimeout(releaseTimer.current)
    if (zoomedIn) {
      setActive(true)
      setUnsupported(!('gpu' in navigator))
      // Warm up the full-screen photo while the pointer is on its way to pressing.
      decodedImage(photo.large).catch(() => {})
    } else if (lazy) {
      // Once zoomed back out, the photo at rest is the image beneath, so the canvas can go.
      const { duration } = transitionTiming(tuning.motion)
      releaseTimer.current = window.setTimeout(
        () => setActive(false),
        (duration + tuning.lead) * 1000 + 100,
      )
    }
  }

  // Until its canvas draws, the photo zooms in CSS. A lazy one waits instead while its canvas
  // starts, so the canvas doesn't begin its zoom behind the CSS one's.
  const cssZoom = !ready && (!lazy || !active || failed || unsupported)
  const handlers = {
    onPointerEnter: (event: ReactPointerEvent) => {
      if (event.pointerType !== 'touch') zoomIn(true)
    },
    onPointerLeave: () => zoomIn(false),
    onFocus: (event: ReactFocusEvent<HTMLElement>) => {
      zoomIn(event.currentTarget.matches(':focus-visible'))
    },
    onBlur: () => zoomIn(false),
  }
  const canvas = active && (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('absolute inset-0 size-full', !ready && 'invisible')}
    />
  )
  return { ready, cssZoom, zoomIn, handlers, canvas }
}

/** A featured photo: a press opens it full screen. */
export function FeaturedPhoto({
  photo,
  tuning,
  onOpen,
}: {
  photo: GalleryPhoto
  tuning: PhotoZoomTuning
  onOpen: OpenPhoto
}) {
  const zoom = useZoomingPhoto({ photo, tuning, radius: TILE_RADIUS, lazy: false })

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      data-cuelume-open
      className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl bg-neutral-200 outline-none data-lifted:invisible dark:bg-neutral-800"
      {...zoom.handlers}
      onClick={(event) => {
        zoom.zoomIn(false)
        // A click from the keyboard (Enter or Space) has no click count.
        onOpen(photo, event.currentTarget, event.detail === 0)
      }}
    >
      <img
        src={photo.small}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        className={cn(
          'size-full object-cover',
          zoom.ready && 'invisible',
          zoom.cssZoom && photoZoomClass,
        )}
      />
      {zoom.canvas}
    </button>
  )
}

/**
 * A photo in the See more overlay, at its own aspect, zooming as the featured photos do. A press
 * opens it full screen.
 */
export function OverlayPhoto({
  photo,
  tuning,
  eager,
  sizes,
  heroCell,
  className,
  onOpen,
}: {
  photo: GalleryPhoto
  tuning: PhotoZoomTuning
  /** Load it straight away, for the photos the overlay's flight lands in. */
  eager: boolean
  /** Its width across the viewport, for srcSet: a column's. */
  sizes: string
  /** Its place among the See more tile's photos, which the overlay's flight finds it by. */
  heroCell?: number
  className?: string
  onOpen: OpenPhoto
}) {
  const zoom = useZoomingPhoto({ photo, tuning, radius: 8 /* rounded-lg */, lazy: true })

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      data-hero-cell={heroCell}
      data-cuelume-open
      className={cn(
        'group relative block w-full cursor-zoom-in overflow-hidden rounded-lg bg-neutral-200 data-lifted:invisible dark:bg-neutral-800',
        className,
      )}
      {...zoom.handlers}
      onClick={(event) => {
        zoom.zoomIn(false)
        onOpen(photo, event.currentTarget, event.detail === 0)
      }}
    >
      <img
        src={photo.small}
        srcSet={`${photo.small} 640w, ${photo.large} 1600w`}
        sizes={sizes}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={cn(
          'block h-auto w-full',
          zoom.ready && 'invisible',
          zoom.cssZoom && photoZoomClass,
        )}
      />
      {zoom.canvas}
    </button>
  )
}
