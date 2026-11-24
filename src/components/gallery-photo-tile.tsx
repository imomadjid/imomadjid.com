import { useRef, useState } from 'react'
import type { FocusEvent as ReactFocusEvent, PointerEvent as ReactPointerEvent } from 'react'

import { useGalleryRenderer } from '#/components/use-gallery-renderer'
import type { GalleryPhoto } from '#/lib/gallery'
import { decodedImage } from '#/lib/gallery-images'
import type { PhotoZoom, PhotoZoomTuning } from '#/lib/gallery-photo-zoom'
import { cn } from '#/lib/utils'

// The CSS fallback's hover zoom, left off while the canvas draws the photo.
const photoZoomClass =
  'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06] motion-reduce:transition-none'

/**
 * A photo that zooms in a little inside its frame on hover or keyboard focus, the middle first
 * (src/lib/gallery-photo-zoom.ts). Its renderer starts as it nears the viewport, or with `lazy`,
 * on the first hover or focus, so a long list only spends canvases on photos someone points at.
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
  const [failed, setFailed] = useState(false)

  const { rendererRef, ready } = useGalleryRenderer<PhotoZoom, PhotoZoomTuning>(
    canvasRef,
    // An inactive photo has no canvas, so nothing starts until it turns active.
    active ? photo.small : '',
    tuning,
    async (canvas, initialTuning, signal, onFail) => {
      const fail = (error: Error) => {
        setFailed(true)
        onFail(error)
      }
      try {
        const { startPhotoZoom } = await import('#/lib/gallery-photo-zoom')
        const zoom = await startPhotoZoom(canvas, photo.small, initialTuning, signal, fail, radius)
        zoom.setZoomedIn(zoomedInRef.current)
        return zoom
      } catch (error) {
        if (!signal.aborted) setFailed(true)
        throw error
      }
    },
  )

  const zoomIn = (zoomedIn: boolean) => {
    zoomedInRef.current = zoomedIn
    rendererRef.current?.setZoomedIn(zoomedIn)
    if (zoomedIn) {
      setActive(true)
      // Without WebGPU no canvas starts, so the CSS zoom stays.
      if (!('gpu' in navigator)) setFailed(true)
      // Warm up the full-screen photo while the pointer is on its way to pressing.
      decodedImage(photo.large).catch(() => {})
    }
  }

  // Until its canvas draws, the photo zooms in CSS. A lazy one waits instead while its canvas
  // starts, so the canvas doesn't begin its zoom behind the CSS one's.
  const cssZoom = !ready && (!lazy || failed || !active)
  const handlers = {
    onPointerEnter: (event: ReactPointerEvent) => event.pointerType !== 'touch' && zoomIn(true),
    onPointerLeave: () => zoomIn(false),
    onFocus: (event: ReactFocusEvent<HTMLElement>) =>
      zoomIn(event.currentTarget.matches(':focus-visible')),
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
  onOpen: (photo: GalleryPhoto, tile: HTMLElement) => void
}) {
  const zoom = useZoomingPhoto({ photo, tuning, radius: 12, lazy: false })

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl bg-neutral-200 outline-none data-lifted:invisible dark:bg-neutral-800"
      {...zoom.handlers}
      onClick={(event) => {
        zoom.zoomIn(false)
        onOpen(photo, event.currentTarget)
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
  heroCell,
  className,
  onOpen,
}: {
  photo: GalleryPhoto
  tuning: PhotoZoomTuning
  /** Load it straight away, for the photos the overlay's flight lands in. */
  eager: boolean
  /** Its place among the See more tile's photos, which the overlay's flight finds it by. */
  heroCell?: number
  className?: string
  onOpen: (photo: GalleryPhoto, tile: HTMLElement) => void
}) {
  const zoom = useZoomingPhoto({ photo, tuning, radius: 8, lazy: true })

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      data-hero-cell={heroCell}
      className={cn(
        'group relative block w-full cursor-zoom-in overflow-hidden rounded-lg bg-neutral-200 data-lifted:invisible dark:bg-neutral-800',
        className,
      )}
      {...zoom.handlers}
      onClick={(event) => {
        zoom.zoomIn(false)
        onOpen(photo, event.currentTarget)
      }}
    >
      <img
        src={photo.small}
        srcSet={`${photo.small} 640w, ${photo.large} 1600w`}
        sizes="25vw"
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
