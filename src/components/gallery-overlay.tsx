import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

import type { FlightStage } from '#/components/gallery-flight-stage'
import { OverlayPhoto } from '#/components/gallery-photo-tile'
import { IconButton } from '#/components/ui/icon-button'
import type { GalleryPhoto } from '#/lib/gallery'
import type { FlightPose } from '#/lib/gallery-flight'
import { cornerLags, coverCrop, quadOf, wholeImage } from '#/lib/gallery-flight-geometry'
import type { Rect } from '#/lib/gallery-flight-geometry'
import { decodedImage, decodedNow } from '#/lib/gallery-images'
import { masonryColumns } from '#/lib/gallery-masonry'
import type { PhotoZoomTuning } from '#/lib/gallery-photo-zoom'
import { fullScaleRect, recedeClass } from '#/lib/page-recede'
import { SEE_MORE_CELL_RADIUS, seeMoreCellRect, seeMoreRestZoom } from '#/lib/see-more-grid'
import { cn } from '#/lib/utils'

// The overlay's columns, and the See more tile's rows and columns: the tile's cell in row r and
// column c leads row r of column c, so its photos fly straight up into their places.
const COLUMNS = 4
const HERO_CELLS = 16
const ROWS = HERO_CELLS / COLUMNS

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

/**
 * A whole photo in its overlay cell, free of the tile's clip (its clip margin is the viewport's
 * diagonal, so the clip grows past every edge of the screen) and still itself.
 */
function cellPose(cell: HTMLElement): FlightPose {
  return {
    corners: quadOf(cell.getBoundingClientRect()),
    texels: quadOf(wholeImage),
    radius: Number.parseFloat(getComputedStyle(cell).borderTopLeftRadius) || 0,
    clipMargin: Math.hypot(window.innerWidth, window.innerHeight),
  }
}

/**
 * Photos of `aspects` in the tile's cells, its box at `rect`, magnified as the tile shows them
 * now: the whole grid when zoomed out, else the 2x crop. Each is clipped to the tile's own edge
 * there, so the outer cells of the crop sit behind it, and has turned into the tile's own photo,
 * so the flight's last frame is the tile's.
 */
function tilePoses(aspects: readonly number[], rect: Rect, zoomedOut: boolean) {
  const zoom = zoomedOut ? 1 : seeMoreRestZoom(rect.width)
  return aspects.map((aspect, index): FlightPose => ({
    corners: quadOf(seeMoreCellRect(rect, index, zoom)),
    texels: quadOf(coverCrop(aspect, 1)),
    radius: SEE_MORE_CELL_RADIUS * zoom,
    clipMargin: 0,
    blend: 1,
  }))
}

const aspectOf = (image: HTMLImageElement) => image.naturalWidth / Math.max(1, image.naturalHeight)

/**
 * The overlay cells that fly back into the tile, by tile cell: in each masonry column, the first
 * four not scrolled up past `top`, or its last four near its end, into that column of the tile,
 * row by row. At the top of the overlay these are the tile's own photos; scrolled down, the photos
 * in view fly home and turn into the tile's on the way, so the close starts from what's on
 * screen. A cell with no photo ready to fly is the tile's own, wherever it is.
 */
function closingCells(
  list: HTMLElement,
  top: number,
  heroes: readonly HTMLImageElement[],
): { cell: HTMLElement; image: HTMLImageElement }[] {
  const picked: (HTMLElement | undefined)[] = []
  for (const [column, ul] of [...list.children].entries()) {
    const cells = [...ul.querySelectorAll<HTMLElement>('button')]
    const first = cells.findIndex((cell) => cell.getBoundingClientRect().bottom > top)
    const start = Math.max(0, Math.min(first < 0 ? cells.length : first, cells.length - ROWS))
    for (let row = 0; row < ROWS; row += 1) picked[row * COLUMNS + column] = cells[start + row]
  }
  return heroes.map((hero, index) => {
    const cell = picked[index]
    const heroIndex = cell?.dataset.heroCell
    const img = cell?.querySelector('img')
    const image =
      heroIndex === undefined
        ? img?.complete && img.naturalWidth > 0
          ? img
          : undefined
        : heroes[Number(heroIndex)]
    if (cell && image) return { cell, image }
    const own = list.querySelector<HTMLElement>(`[data-hero-cell="${index}"]`)
    if (!own) throw new Error(`The See more overlay has no cell ${index}`)
    return { cell: own, image: hero }
  })
}

/** The tile's box and corner radius, which the flying cells are clipped to near it. */
function tileClip(tile: HTMLElement, rect: Rect) {
  return { rect, radius: Number.parseFloat(getComputedStyle(tile).borderTopLeftRadius) || 0 }
}

/**
 * Each cell's corner lags, as a single photo's are (cornerLags), led across all 16 cells: opening,
 * the corner with the farthest to go leads and the grid stretches out; closing, the corner nearest
 * its place in the tile lands first and the far side trails in.
 */
function cellLags(
  from: readonly FlightPose[],
  to: readonly FlightPose[],
  direction: 'open' | 'close',
) {
  const lags = cornerLags(
    from.flatMap((pose) => pose.corners),
    to.flatMap((pose) => pose.corners),
    Math.hypot(window.innerWidth, window.innerHeight),
    direction === 'open' ? 'farthest' : 'nearest',
  )
  return from.map((_, index) => lags.slice(index * 4, index * 4 + 4))
}

/**
 * Opens and closes the See more overlay. Where WebGPU runs, the tile's 16 photos fly out of its
 * cells into the first rows of the masonry columns, each corner on its own spring
 * (src/lib/gallery-flight.ts), led as a single photo's are. Closing flies them back into the
 * tile, turning around with their speed if the open is still under way, straight into the cells
 * as it shows them. Each cell is clipped to the tile's rounded edge grown by a margin that
 * springs with it, wide open in the overlay and closed in the tile, so the outer cells of the 2x
 * crop slide behind the tile's edge as they land, and slide out from behind it opening, in one
 * motion. Scrolled down, the photos in view fly home instead and turn into the tile's on the way
 * (closingCells), so however long the list grows, the close starts from what's on screen. Without
 * WebGPU it fades.
 *
 * `photos` are the tile's, in its order; `tileRef` is its grid's box and `zoomedOutRef` whether
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
    const from = tilePoses(
      photos.map((photo) => photo.width / photo.height),
      tileRect,
      zoomedOutRef.current,
    )
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
          lags: cellLags(from, to, 'open'),
          direction: 'open',
          clip: tileClip(tile, tileRect),
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
    const heroes = photos.flatMap((photo) => decodedNow(photo.small) ?? [])
    const list = listRef.current
    // Without the renderer, or before the photos took off, there is nothing to fly back.
    if (!flight || !tile || !shown.lifted || !list || heroes.length !== HERO_CELLS) {
      setShown(null)
      return
    }
    // Mid-open, the tile's photos turn back from where they are.
    const turning = shown.phase === 'opening' ? flight.cellPoses() : null
    const header = list.parentElement?.querySelector('header')
    const flown = turning
      ? null
      : closingCells(list, header?.getBoundingClientRect().bottom ?? 0, heroes)
    const sources = flown?.map(({ image }) => image) ?? heroes
    const from = turning ?? (flown ?? []).map(({ cell }) => cellPose(cell))
    // The flown cells leave the overlay as it fades; the tile's own already have.
    for (const { cell } of flown ?? []) cell.setAttribute('data-lifted', '')
    // Where the tile will be once the page behind the overlay has grown back.
    const tileRect = fullScaleRect(tile)
    const to = tilePoses(sources.map(aspectOf), tileRect, zoomedOutRef.current)
    const landing = flight.flyCells({
      photos: sources,
      into: heroes,
      from,
      to,
      lags: cellLags(from, to, 'close'),
      direction: 'close',
      clip: tileClip(tile, tileRect),
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
  photoTuning,
  listRef,
  flies,
  cellsLifted,
  closing,
  onClose,
  onOpenPhoto,
}: {
  /** Every photo, the See more tile's first. */
  photos: readonly GalleryPhoto[]
  /** Each photo's hover zoom, as the featured photos'. */
  photoTuning: PhotoZoomTuning
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
                      <OverlayPhoto
                        photo={photo}
                        tuning={photoTuning}
                        // The tile's photos land here straight away.
                        eager={hero}
                        heroCell={hero ? index : undefined}
                        className={cn(flown && cellsLifted && 'invisible')}
                        onOpen={onOpenPhoto}
                      />
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
