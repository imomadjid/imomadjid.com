import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import cameraPhoto from '#/assets/camera/fujifilm-x-t30-iii.webp'
import { IconButton } from '#/components/ui/icon-button'
import { featuredCount, galleryPhotos } from '#/lib/gallery'
import type { GalleryPhoto } from '#/lib/gallery'
import type { GalleryWarp } from '#/lib/gallery-warp'
import { defaultWarpTuning } from '#/lib/gallery-warp-settings'
import { cn } from '#/lib/utils'

const tileClass = 'aspect-square w-full rounded-xl bg-neutral-200 dark:bg-neutral-800'

// Allo's open figures (ss03), slashed zero, and tabular figures, as on the project years.
const figuresClass = "[font-feature-settings:'ss03'] whitespace-nowrap slashed-zero tabular-nums"

/** Text with its digit runs set in the project years' figure style. A range stays on one line. */
function Figures({ text }: { text: string }) {
  return text.split(/(\d[\d.]*(?:[–-]\d[\d.]*)?)/).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={figuresClass}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}

// Overlay photos past this index enter together, so a long list doesn't trail in.
const maxStagger = 12

function enterIndex(index: number): CSSProperties & { '--enter-index': number } {
  return { '--enter-index': Math.min(index, maxStagger) }
}

// The See more tile's CSS zoom. Left off while the warp canvas draws the tile, so the hidden grid
// doesn't run a layout transition and hold a layer on every hover.
const seeMoreZoomClass =
  'transition-[scale,inset] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:inset-0 group-hover:scale-100 group-hover:will-change-transform group-focus-visible:inset-0 group-focus-visible:scale-100 group-focus-visible:will-change-transform motion-reduce:transition-none'

// A resting See more cell shows about half the tile (at most 88px of a 176px tile) and crops a
// 3:2 photo to its short side, so it needs about 1.5x that width: 132px, or a quarter of the
// column on narrow screens (100vw less 3rem of padding and two 0.5rem gaps, over 3 tiles, x0.75).
const seeMoreCellSizes = '(min-width: 592px) 132px, calc((100vw - 64px) / 4)'

// The thumbnails' long side, from tools/gallery/import.sh.
const thumbLongSide = 240

// The See more tile's preview: the photos past the grid, then from the top, 16 in all.
function previewPhotos(photos: readonly GalleryPhoto[], featuredCount: number) {
  return [...photos.slice(featuredCount), ...photos.slice(0, featuredCount)].slice(0, 16)
}

/**
 * A 4x4 grid of thumbnails shown at 2x, so its middle 2x2 fills the tile. Hover or focus zooms
 * out to the whole grid and shows the label. Where WebGPU runs, a canvas draws the grid instead
 * (src/lib/gallery-warp.ts) and the middle zooms ahead of the edges; it starts as the tile nears
 * the viewport and takes over after its first frame, so the CSS grid below is the fallback.
 *
 * Both pick the 640px photos over the thumbnails where a resting cell has more device pixels than
 * a thumbnail's square crop, as on most 2x and 3x screens.
 *
 * In the CSS grid, at 2x the grid overhangs the tile by half a gap on each side, so the crop's
 * edges land on cell edges; cells have half the tiles' radius for the same reason. The overhang
 * shrinks to nothing as it zooms out, or the tile would clip the edge cells' corners at 1x. While
 * zoomed out, will-change keeps the grid on its own layer, so Chrome doesn't repaint it snapped to
 * whole pixels as the zoom ends, a visible settle when the tile sits at a fractional offset. Cells
 * are squares sized by width: a 100% height fills its row in Chrome but takes the image's own
 * proportions in Safari.
 */
function SeeMoreTile({ photos, total }: { photos: readonly GalleryPhoto[]; total: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const warpRef = useRef<GalleryWarp | null>(null)
  const zoomedOutRef = useRef(false)
  const [warped, setWarped] = useState(false)
  // Strings, so the effect restarts only when the photos change, not on every new array.
  const thumbUrls = photos.map((photo) => photo.thumb).join(' ')
  const smallUrls = photos.map((photo) => photo.small).join(' ')
  const thumbCrop = Math.min(
    ...photos.map(
      (photo) =>
        (thumbLongSide * Math.min(photo.width, photo.height)) / Math.max(photo.width, photo.height),
    ),
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !('gpu' in navigator)) return
    const abort = new AbortController()
    const fallBack = (error: Error) => {
      warpRef.current = null
      setWarped(false)
      console.warn('The See more tile is using its CSS zoom:', error)
    }
    const start = () => {
      // Device pixels across a resting cell: half the tile.
      const cellPixels = (canvas.clientWidth / 2) * devicePixelRatio
      const urls = (cellPixels > thumbCrop ? smallUrls : thumbUrls).split(' ')
      void import('#/lib/gallery-warp')
        .then(({ startGalleryWarp }) =>
          startGalleryWarp(canvas, urls, defaultWarpTuning, abort.signal, fallBack),
        )
        .then((warp) => {
          warpRef.current = warp
          warp.setZoomedOut(zoomedOutRef.current)
          // The renderer draws its first frame in the next animation frame, before this callback.
          // A renderer that failed in between has cleared the ref and must not hide the fallback.
          requestAnimationFrame(() => {
            if (!abort.signal.aborted && warpRef.current === warp) setWarped(true)
          })
        })
        .catch((error) => {
          if (!abort.signal.aborted)
            fallBack(error instanceof Error ? error : new Error(String(error)))
        })
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        start()
      },
      { rootMargin: '50% 0px' },
    )
    observer.observe(canvas)
    return () => {
      observer.disconnect()
      abort.abort()
      warpRef.current = null
    }
  }, [thumbUrls, smallUrls, thumbCrop])

  const zoomOut = (zoomedOut: boolean) => {
    zoomedOutRef.current = zoomedOut
    warpRef.current?.setZoomedOut(zoomedOut)
  }

  return (
    <Dialog.Trigger
      aria-label={`See all ${total} photos`}
      className="group relative block w-full cursor-pointer rounded-xl outline-none"
      // Touch has no hover; a tap opens the overlay.
      onPointerEnter={(event) => event.pointerType !== 'touch' && zoomOut(true)}
      onPointerLeave={() => zoomOut(false)}
      onFocus={(event) => zoomOut(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => zoomOut(false)}
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-xl">
        <span
          className={cn(
            'absolute -inset-px grid scale-200 grid-cols-4 content-start gap-0.5',
            warped ? 'invisible' : seeMoreZoomClass,
          )}
        >
          {photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.thumb}
              srcSet={`${photo.thumb} ${thumbLongSide}w, ${photo.small} 640w`}
              sizes={seeMoreCellSizes}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-square w-full rounded-md bg-neutral-200 object-cover dark:bg-neutral-800"
            />
          ))}
        </span>
        <canvas
          ref={canvasRef}
          aria-hidden
          className={cn('absolute inset-0 size-full', !warped && 'invisible')}
        />
      </span>
      <span className="pointer-events-none absolute inset-x-0 top-full mt-2 translate-y-1 text-center text-sm text-neutral-600 opacity-0 transition-[opacity,translate] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none dark:text-neutral-400 pointer-coarse:translate-y-0 pointer-coarse:opacity-100">
        See more
      </span>
    </Dialog.Trigger>
  )
}

/** The Gallery section: the camera, the favourites, and a tile that opens every photo. */
function Gallery({
  photos,
  featuredCount,
}: {
  photos: readonly GalleryPhoto[]
  featuredCount: number
}) {
  const featured = photos.slice(0, featuredCount)

  return (
    <Dialog.Root>
      <div className="flex flex-col gap-10">
        <div className="flex items-center justify-between gap-6 sm:gap-8">
          <img
            src={cameraPhoto}
            alt="FUJIFILM X-T30 III camera"
            width={270}
            height={175}
            className="h-auto w-[17%] max-w-22.5 shrink-0"
          />
          <p className="grid gap-y-1.5 text-right text-xs font-semibold">
            <span className="text-neutral-900 dark:text-neutral-100">
              <Figures text="FUJIFILM X-T30 III" />
            </span>
            <span className="text-neutral-500">
              <Figures text="FUJINON XC13-33mmF3.5-6.3 OIS" />
            </span>
          </p>
        </div>
        <ul className="grid w-full grid-cols-3 gap-2">
          {featured.map((photo) => (
            <li key={photo.id}>
              <img
                src={photo.small}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className={cn(tileClass, 'object-cover')}
              />
            </li>
          ))}
          <li>
            <SeeMoreTile photos={previewPhotos(photos, featuredCount)} total={photos.length} />
          </li>
        </ul>
      </div>

      {/* Portalled to the body, outside main's stacking context, so it covers the Sunlit light
          and the blind wand. */}
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-surface-1/85 backdrop-blur-2xl transition-opacity duration-300 ease-out data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed inset-0 z-50 overflow-y-auto overscroll-contain transition-opacity duration-300 ease-out outline-none data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 motion-reduce:transition-none">
          <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
            <div className="sticky top-0 z-10 -mx-4 mb-1 flex items-center justify-between bg-surface-1/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
              <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                Gallery
              </Dialog.Title>
              <Dialog.Close render={<IconButton aria-label="Close gallery" />}>
                <IconX size={18} stroke={1.75} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <ul className="columns-2 gap-3 sm:columns-3">
              {photos.map((photo, index) => (
                <li
                  key={photo.id}
                  className="mb-3 animate-enter break-inside-avoid [--enter-step:30ms]"
                  style={enterIndex(index)}
                >
                  <img
                    src={photo.small}
                    srcSet={`${photo.small} 640w, ${photo.large} 1600w`}
                    sizes="(min-width: 1024px) 330px, (min-width: 640px) 33vw, 50vw"
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full rounded-lg bg-neutral-200 dark:bg-neutral-800"
                  />
                </li>
              ))}
            </ul>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** The Gallery with its photos. Default export for `lazy`, which keeps it out of production. */
export default function GallerySection() {
  return <Gallery photos={galleryPhotos} featuredCount={featuredCount} />
}
