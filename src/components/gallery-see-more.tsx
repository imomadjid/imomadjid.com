import { Dialog } from '@base-ui/react/dialog'
import { useRef } from 'react'
import type { RefObject } from 'react'

import { useGalleryRenderer } from '#/components/use-gallery-renderer'
import type { GalleryPhoto } from '#/lib/gallery'
import type { GalleryWarp, WarpTuning } from '#/lib/gallery-warp'
import { coarsePointerQuery } from '#/lib/media-query'
import { cn } from '#/lib/utils'

// The See more tile's CSS zoom. Left off while the warp canvas draws the tile, so the hidden grid
// doesn't run a layout transition and hold a layer on every hover.
const seeMoreZoomClass =
  'transition-[scale,inset] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:inset-0 group-hover:scale-100 group-hover:will-change-transform pointer-fine:group-focus-visible:inset-0 pointer-fine:group-focus-visible:scale-100 pointer-fine:group-focus-visible:will-change-transform motion-reduce:transition-none'

// A resting See more cell shows about half the tile (at most 88px of a 176px tile) and crops a
// 3:2 photo to its short side, so it needs about 1.5x that width: 132px, or a quarter of the
// column on narrow screens (100vw less 3rem of padding and two 0.5rem gaps, over 3 tiles, x0.75).
const seeMoreCellSizes = '(min-width: 592px) 132px, calc((100vw - 64px) / 4)'

// The thumbnails' long side, from tools/gallery/import.sh.
const thumbLongSide = 240

/**
 * A 4x4 grid of thumbnails shown at 2x, so its middle 2x2 fills the tile. Hover or focus zooms
 * out to the whole grid and shows the label. Where the overlay has two columns, the tile is a
 * plain 2x2 grid of their rows from tileCells' start row instead, which doesn't zoom. Where WebGPU runs,
 * a canvas draws the grid instead (src/lib/gallery-warp.ts) and the middle zooms ahead of the
 * edges; it starts as the tile nears the viewport and takes over after its first frame, so the CSS
 * grid below is the fallback.
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
export function SeeMoreTile({
  photos,
  columns,
  total,
  tuning,
  tileRef,
  zoomedOutRef,
  onIntent,
}: {
  photos: readonly GalleryPhoto[]
  /** The grid's width and height in cells: 4, or 2 (useOverlayColumns). */
  columns: number
  total: number
  tuning: WarpTuning
  /** The grid's box, which the See more overlay's photos fly out of and back into. */
  tileRef: RefObject<HTMLSpanElement | null>
  /** Whether the tile shows its whole grid, for the overlay's flight. */
  zoomedOutRef: RefObject<boolean>
  /** A hover or focus that may open the overlay. */
  onIntent: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Strings, so the renderer restarts only when the photos change, not on every new array.
  const thumbUrls = photos.map((photo) => photo.thumb).join(' ')
  const smallUrls = photos.map((photo) => photo.small).join(' ')
  const thumbCrop = Math.min(
    ...photos.map(
      (photo) =>
        (thumbLongSide * Math.min(photo.width, photo.height)) / Math.max(photo.width, photo.height),
    ),
  )

  // The warp draws the 4x4 grid only.
  const warps = columns === 4
  const { rendererRef, ready } = useGalleryRenderer<GalleryWarp, WarpTuning>(
    canvasRef,
    `${thumbUrls} ${smallUrls}`,
    tuning,
    async (canvas, initialTuning, signal, onFail) => {
      // Device pixels across a resting cell: half the tile.
      const cellPixels = (canvas.clientWidth / 2) * devicePixelRatio
      const urls = (cellPixels > thumbCrop ? smallUrls : thumbUrls).split(' ')
      const { startGalleryWarp } = await import('#/lib/gallery-warp')
      const warp = await startGalleryWarp(canvas, urls, initialTuning, signal, onFail)
      warp.setZoomedOut(zoomedOutRef.current)
      return warp
    },
    undefined,
    warps,
  )

  const zoomOut = (zoomedOut: boolean) => {
    zoomedOutRef.current = zoomedOut
    rendererRef.current?.setZoomedOut(zoomedOut)
  }

  return (
    <Dialog.Trigger
      aria-label={`See all ${total} photos`}
      className="group relative block w-full cursor-pointer rounded-xl outline-none"
      // Touch has no hover; a tap opens the overlay.
      onPointerEnter={(event) => {
        onIntent()
        if (event.pointerType !== 'touch') zoomOut(true)
      }}
      onPointerLeave={() => zoomOut(false)}
      onFocus={(event) => {
        onIntent()
        // Only keyboard focus zooms out. A click focuses the tile too (in Chrome), and must leave
        // the hover's zoom alone, or it zooms back in as the overlay opens. Nor does it on a touch
        // screen, which has no hover to match: Safari can show focus returned there as keyboard
        // focus.
        if (
          event.currentTarget.matches(':focus-visible') &&
          !matchMedia(coarsePointerQuery).matches
        )
          zoomOut(true)
      }}
      onBlur={() => zoomOut(false)}
    >
      {/* Empty while its photos are out in the overlay (data-lifted). */}
      <span
        ref={tileRef}
        className="relative block aspect-square w-full overflow-hidden rounded-xl data-lifted:invisible"
      >
        <span
          className={cn(
            'absolute grid content-start gap-0.5',
            warps
              ? cn('-inset-px scale-200 grid-cols-4', ready ? 'invisible' : seeMoreZoomClass)
              : 'inset-0 grid-cols-2',
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
          className={cn('absolute inset-0 size-full', !ready && 'invisible')}
        />
      </span>
      <span className="pointer-events-none absolute inset-x-0 top-full mt-2 translate-y-1 text-center text-sm text-neutral-600 opacity-0 transition-[opacity,translate] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none dark:text-neutral-400 pointer-coarse:translate-y-0 pointer-coarse:opacity-100">
        See more
      </span>
    </Dialog.Trigger>
  )
}
