import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

import type { FlightStage } from '#/components/gallery-flight-stage'
import { IconButton } from '#/components/ui/icon-button'
import type { GalleryPhoto } from '#/lib/gallery'
import type { FlightPose } from '#/lib/gallery-flight'
import { centerOutLags, coverCrop, quadOf, wholeImage } from '#/lib/gallery-flight-geometry'
import type { Rect } from '#/lib/gallery-flight-geometry'
import { decodedImage, decodedNow } from '#/lib/gallery-images'
import { masonryColumns } from '#/lib/gallery-masonry'
import { fullScaleRect, recedeClass } from '#/lib/page-recede'
import {
  SEE_MORE_CELL_RADIUS,
  seeMoreCellRect,
  seeMoreRestZoom,
  visibleFraction,
} from '#/lib/see-more-grid'
import { cn } from '#/lib/utils'

// The overlay's columns, and the See more tile's rows and columns: the tile's cell in row r and
// column c leads row r of column c, so its photos fly straight up into their places.
const COLUMNS = 4
const HERO_CELLS = 16

// Overlay photos past this index enter together, so a long list doesn't trail in.
const maxStagger = 12

function enterIndex(index: number): CSSProperties & { '--enter-index': number } {
  return { '--enter-index': Math.min(index, maxStagger) }
}

type Phase = 'opening' | 'open' | 'closing'

type Shown = {
  phase: Phase
  /** True once the tile's photos have flown out of it, until they land back. */
  lifted: boolean
}

/** The overlay's first cells, in order, once its popup has mounted. */
async function heroCells(list: RefObject<HTMLElement | null>): Promise<HTMLElement[]> {
  for (let frame = 0; frame < 10; frame += 1) {
    const cells = list.current?.querySelectorAll<HTMLElement>('[data-hero-cell]')
    if (cells?.length === HERO_CELLS)
      return [...cells].sort((a, b) => Number(a.dataset.heroCell) - Number(b.dataset.heroCell))
    await new Promise(requestAnimationFrame)
  }
  throw new Error('The See more overlay did not mount')
}

/** A whole photo in its overlay cell. */
function cellPose(cell: HTMLElement): FlightPose {
  return {
    corners: quadOf(cell.getBoundingClientRect()),
    texels: quadOf(wholeImage),
    radius: Number.parseFloat(getComputedStyle(cell).borderTopLeftRadius) || 0,
  }
}

/**
 * The tile's photos in its cells, its box at `rect`, magnified as the tile shows them now: the
 * whole grid when zoomed out, else the 2x crop, where the outer cells lie outside the tile and
 * start unseen.
 */
function tilePoses(photos: readonly GalleryPhoto[], rect: Rect, zoomedOut: boolean) {
  const zoom = zoomedOut ? 1 : seeMoreRestZoom(rect.width)
  return photos.map((photo, index): FlightPose => {
    const cell = seeMoreCellRect(rect, index, zoom)
    return {
      corners: quadOf(cell),
      texels: quadOf(coverCrop(photo.width / photo.height, 1)),
      radius: SEE_MORE_CELL_RADIUS * zoom,
      opacity: visibleFraction(cell, rect),
    }
  })
}

/**
 * Each cell's corner lags, from where its corners sit in the tile: opening, the corners nearest
 * the tile's middle lead and the rim follows, so the grid morphs open from its centre (as the
 * tile's own zoom does); closing runs the other way, the rim first and the middle landing last.
 */
function cellLags(inTile: readonly FlightPose[], rect: Rect, direction: 'open' | 'close') {
  const lags = centerOutLags(
    inTile.flatMap((pose) => pose.corners),
    [rect.x + rect.width / 2, rect.y + rect.height / 2],
  ).map((lag) => (direction === 'open' ? lag : 1 - lag))
  return inTile.map((_, index) => lags.slice(index * 4, index * 4 + 4))
}

/**
 * Opens and closes the See more overlay. Where WebGPU runs, the tile's 16 photos fly out of its
 * cells into the first rows of the masonry columns, each corner on its own spring
 * (src/lib/gallery-flight.ts), the tile's middle first. Closing flies them back into the tile,
 * turning around with their speed if the open is still under way, and the tile takes them in as
 * the canvas fades. Without WebGPU it fades.
 *
 * `photos` are the tile's, in its order; `tileRef` is its grid's box, and `zoomedOutRef` whether
 * it shows the whole grid. Returns the dialog root's `open` and `onOpenChange`, `prepare` to warm
 * the photos up on hover, and the overlay's state.
 */
export function useSeeMoreOverlay({
  stage,
  photos,
  tileRef,
  zoomedOutRef,
}: {
  stage: FlightStage
  photos: readonly GalleryPhoto[]
  tileRef: RefObject<HTMLElement | null>
  zoomedOutRef: RefObject<boolean>
}) {
  const [shown, setShown] = useState<Shown | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Bumped by every open and close, so a step still waiting on an earlier one can tell it's stale.
  const flightToken = useRef(0)

  // The tile stays empty while its photos are out, in flight or in the overlay.
  const tileLifted = shown?.lifted ?? false
  useLayoutEffect(() => {
    const tile = tileLifted ? tileRef.current : null
    tile?.setAttribute('data-lifted', '')
    return () => tile?.removeAttribute('data-lifted')
  }, [tileLifted, tileRef])

  const prepare = () => {
    for (const photo of photos) decodedImage(photo.small).catch(() => {})
  }

  const openOverlay = () => {
    const flight = stage.flightRef.current
    const tile = tileRef.current
    const token = ++flightToken.current
    const current = () => flightToken.current === token
    if (!flight || !tile || photos.length !== HERO_CELLS) {
      setShown({ phase: 'open', lifted: false })
      return
    }
    // The overlay mounts with the first cells empty, to be filled by the flight.
    setShown({ phase: 'opening', lifted: false })
    const tileRect = tile.getBoundingClientRect()
    const from = tilePoses(photos, tileRect, zoomedOutRef.current)
    let cells: HTMLElement[] = []
    Promise.all(photos.map((photo) => decodedImage(photo.small)))
      .then(async (images) => {
        cells = await heroCells(listRef)
        // Closed before the photos were ready: they never take off.
        if (!current()) return false
        const to = cells.map(cellPose)
        const landing = flight.flyCells({
          photos: images,
          from,
          to,
          lags: cellLags(from, tileRect, 'open'),
          direction: 'open',
        })
        setShown((shown) => (shown && current() ? { ...shown, lifted: true } : shown))
        stage.show()
        return landing
      })
      .then(async (landed) => {
        if (!landed) return
        // Keep the flight's last frame up until the cells can replace it.
        const images = cells.flatMap((cell) => [...cell.querySelectorAll('img')])
        await Promise.all(images.map((image) => image.decode().catch(() => {})))
        if (!current()) return
        // One commit: the cells show as the canvas hides.
        setShown((shown) => (shown ? { ...shown, phase: 'open' } : shown))
        stage.hide(false)
      })
      .catch((error) => {
        console.warn('The See more overlay opened without its expand:', error)
        if (!current()) return
        setShown((shown) => (shown ? { ...shown, phase: 'open' } : shown))
        stage.hide(false)
      })
  }

  const closeOverlay = () => {
    if (!shown || shown.phase === 'closing') return
    const flight = stage.flightRef.current
    const tile = tileRef.current
    const token = ++flightToken.current
    const images = photos.map((photo) => decodedNow(photo.small))
    const cells = listRef.current?.querySelectorAll<HTMLElement>('[data-hero-cell]')
    // Without the renderer, or before the photos took off, there is nothing to fly back.
    if (!flight || !tile || !shown.lifted || !cells || !images.every((image) => image)) {
      setShown(null)
      return
    }
    // Mid-open, the cells turn back from where they are.
    const from =
      (shown.phase === 'opening' ? flight.cellPoses() : null) ??
      [...cells]
        .sort((a, b) => Number(a.dataset.heroCell) - Number(b.dataset.heroCell))
        .map(cellPose)
    // Where the tile will be once the page behind the overlay has grown back.
    const tileRect = fullScaleRect(tile)
    const to = tilePoses(photos, tileRect, zoomedOutRef.current)
    const landing = flight.flyCells({
      photos: images.filter((image) => image !== undefined),
      from,
      to,
      lags: cellLags(to, tileRect, 'close'),
      direction: 'close',
    })
    setShown({ phase: 'closing', lifted: true })
    stage.show()
    // Landed or not (a lost device ends the flight early), the overlay closes.
    const close = (landed: boolean) => {
      if (flightToken.current !== token) return
      setShown(null)
      // Landed photos fade into the lit tile; ones cut short by a failure just go.
      stage.hide(landed)
    }
    landing.then(close, () => close(false))
  }

  return {
    open: shown !== null,
    onOpenChange: (open: boolean) => (open ? openOverlay() : closeOverlay()),
    close: closeOverlay,
    prepare,
    /** The first cells are empty while the flight shows their photos. */
    cellsLifted: shown !== null && shown.phase !== 'open',
    closing: shown?.phase === 'closing',
    /** For GalleryOverlay's `listRef`. */
    listRef,
  }
}

/**
 * The See more overlay: every photo in four masonry columns across the viewport. Opening one
 * nests the lightbox in it. Render it inside the dialog root `useSeeMoreOverlay` drives, with
 * that hook's state.
 */
export function GalleryOverlay({
  photos,
  listRef,
  flies,
  cellsLifted,
  closing,
  onClose,
  onOpenPhoto,
}: {
  /** Every photo, the See more tile's first. */
  photos: readonly GalleryPhoto[]
  listRef: RefObject<HTMLDivElement | null>
  /** Whether the tile's photos fly in; if not, they enter with the rest. */
  flies: boolean
  cellsLifted: boolean
  closing: boolean
  onClose: () => void
  onOpenPhoto: (photo: GalleryPhoto, tile: HTMLElement) => void
}) {
  const columns = masonryColumns(
    photos.map((photo) => photo.height / photo.width),
    COLUMNS,
    HERO_CELLS / COLUMNS,
  )
  const gap = 'gap-1.5 sm:gap-2'

  return (
    // Portalled to the body, outside main's stacking context, so it covers the Sunlit light and
    // the blind wand.
    <Dialog.Portal>
      <Dialog.Backdrop
        className={cn(
          'fixed inset-0 z-50 bg-surface-1/60 backdrop-blur-md transition-opacity duration-300 ease-out data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 motion-reduce:transition-none',
          closing && 'opacity-0 duration-200',
        )}
      />
      {/* A click beside the photos and the header closes it, as a click on an open photo closes
          that: from a photo opened in the grid, two clicks lead back to the page. */}
      <Dialog.Popup
        className={cn(
          'fixed inset-0 z-50 cursor-zoom-out overflow-y-auto overscroll-contain transition-opacity duration-300 ease-out outline-none data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 motion-reduce:transition-none',
          closing && 'opacity-0 duration-200',
        )}
        onClick={(event) => {
          if (event.target instanceof Element && !event.target.closest('button, header')) onClose()
        }}
      >
        <div className="px-2 pb-16 sm:px-4">
          <header className="sticky top-0 z-10 -mx-2 mb-1 flex cursor-auto items-center justify-between bg-surface-1/80 px-2 py-3 backdrop-blur-xl sm:-mx-4 sm:px-4">
            <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
              Gallery
            </Dialog.Title>
            <Dialog.Close render={<IconButton aria-label="Close gallery" />}>
              <IconX size={18} stroke={1.75} aria-hidden="true" />
            </Dialog.Close>
          </header>
          {/* Shrinks behind a photo opened from it (src/lib/page-recede.ts). */}
          <div
            ref={listRef}
            data-recede
            className={cn('grid grid-cols-4 items-start', gap, recedeClass)}
          >
            {columns.map((column) => (
              <ul key={column[0]} className={cn('grid', gap)}>
                {column.map((index) => {
                  const photo = photos[index]
                  const hero = index < HERO_CELLS
                  const flown = flies && hero
                  return (
                    <li
                      key={photo.id}
                      className={cn(!flown && 'animate-enter [--enter-step:30ms]')}
                      style={flown ? undefined : enterIndex(flies ? index - HERO_CELLS : index)}
                    >
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        data-hero-cell={hero ? index : undefined}
                        className={cn(
                          'block w-full cursor-zoom-in overflow-hidden rounded-lg bg-neutral-200 data-lifted:invisible dark:bg-neutral-800',
                          flown && cellsLifted && 'invisible',
                        )}
                        onClick={(event) => onOpenPhoto(photo, event.currentTarget)}
                      >
                        <img
                          src={photo.small}
                          srcSet={`${photo.small} 640w, ${photo.large} 1600w`}
                          sizes="25vw"
                          alt={photo.alt}
                          width={photo.width}
                          height={photo.height}
                          // The tile's photos land here straight away.
                          loading={hero ? 'eager' : 'lazy'}
                          decoding="async"
                          className="block h-auto w-full"
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            ))}
          </div>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  )
}
