import { useRef } from 'react'

import { useGalleryRenderer } from '#/components/use-gallery-renderer'
import type { GalleryPhoto } from '#/lib/gallery'
import { decodedImage } from '#/lib/gallery-images'
import type { PhotoZoom, PhotoZoomTuning } from '#/lib/gallery-photo-zoom'
import { cn } from '#/lib/utils'

// The CSS fallback's hover zoom, left off while the canvas draws the photo.
const photoZoomClass =
  'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06] motion-reduce:transition-none'

/**
 * A featured photo. Hover or focus zooms it in a little inside its frame, the middle first
 * (src/lib/gallery-photo-zoom.ts), and a press opens it full screen. While it is open the tile
 * stays empty, as if the photo had lifted out of it.
 */
export function FeaturedPhoto({
  photo,
  tuning,
  lifted,
  onOpen,
}: {
  photo: GalleryPhoto
  tuning: PhotoZoomTuning
  lifted: boolean
  onOpen: (photo: GalleryPhoto, tile: HTMLElement) => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const zoomedInRef = useRef(false)

  const { rendererRef, ready } = useGalleryRenderer<PhotoZoom, PhotoZoomTuning>(
    canvasRef,
    photo.small,
    tuning,
    async (canvas, initialTuning, signal, onFail) => {
      const { startPhotoZoom } = await import('#/lib/gallery-photo-zoom')
      const zoom = await startPhotoZoom(canvas, photo.small, initialTuning, signal, onFail)
      zoom.setZoomedIn(zoomedInRef.current)
      return zoom
    },
  )

  const zoomIn = (zoomedIn: boolean) => {
    zoomedInRef.current = zoomedIn
    rendererRef.current?.setZoomedIn(zoomedIn)
    // Warm up the full-screen photo while the pointer is on its way to pressing.
    if (zoomedIn) decodedImage(photo.large).catch(() => {})
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-haspopup="dialog"
      className={cn(
        'group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl bg-neutral-200 outline-none dark:bg-neutral-800',
        lifted && 'invisible',
      )}
      onPointerEnter={(event) => event.pointerType !== 'touch' && zoomIn(true)}
      onPointerLeave={() => zoomIn(false)}
      onFocus={(event) => zoomIn(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => zoomIn(false)}
      onClick={() => {
        zoomIn(false)
        if (buttonRef.current) onOpen(photo, buttonRef.current)
      }}
    >
      <img
        src={photo.small}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        className={cn('size-full object-cover', ready ? 'invisible' : photoZoomClass)}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn('absolute inset-0 size-full', !ready && 'invisible')}
      />
    </button>
  )
}
