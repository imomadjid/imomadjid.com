import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { play } from 'cuelume'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

import type { FlightStage } from '#/components/gallery-flight-stage'
import { galleryBackdropClass, returnFocus } from '#/components/gallery-lightbox'
import { OverlayPhoto } from '#/components/gallery-photo-tile'
import type { OpenPhoto } from '#/components/gallery-photo-tile'
import { LiveGlassSourceProvider } from '#/components/live-glass'
import { IconButton } from '#/components/ui/icon-button'
import type { GalleryPhoto } from '#/lib/gallery'
import type { FlightPose } from '#/lib/gallery-flight'
import {
  cornerLags,
  cornerRadius,
  coverCrop,
  diagonal,
  imageAspect,
  quadOf,
  viewportRect,
  wholeImage,
} from '#/lib/gallery-flight-geometry'
import type { Rect } from '#/lib/gallery-flight-geometry'
import { decodedImage, decodedNow } from '#/lib/gallery-images'
import { masonryColumns } from '#/lib/gallery-masonry'
import type { PhotoZoomTuning } from '#/lib/gallery-photo-zoom'
import type { LiveGlassSource } from '#/lib/live-glass-source'
import { fullScaleRect, recedeClass } from '#/lib/page-recede'
import { SEE_MORE_CELL_RADIUS, seeMoreCellRect, seeMoreRestZoom } from '#/lib/see-more-grid'
import { playOpenRun } from '#/lib/sound'
import { cn } from '#/lib/utils'

// The overlay's columns, and the See more tile's rows and columns: the tile's cell in row r and
// column c leads row r of column c, so its photos fly straight up into their places.
const COLUMNS = 4
export const HERO_CELLS = 16
const ROWS = HERO_CELLS / COLUMNS

// Overlay photos past this index enter together, so a long list doesn't trail in.
const maxStagger = 12

function enterIndex(index: number): CSSProperties & { '--enter-index': number } {
  return { '--enter-index': Math.min(index, maxStagger) }
}

type Phase = 'opening' | 'open' | 'closing'

type Shown = {
  phase: Phase
  /** Whether the tile's photos fly into the overlay, rather than entering with the rest. */
  flies: boolean
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

/** A whole photo in its overlay cell, still itself. */
function cellPose(cell: HTMLElement): FlightPose {
  return {
    corners: quadOf(cell.getBoundingClientRect()),
    texels: quadOf(wholeImage),
    radius: cornerRadius(cell),
  }
}

/**
 * Photos of `aspects` in the tile's cells, its box at `rect`, magnified as the tile shows them
 * now: the whole grid when zoomed out, else the 2x crop, where the flight's clip (tileClip) hides
 * the outer cells behind the tile's edge. Each has turned into the tile's own photo, so the
 * flight's last frame is the tile's.
 */
function tilePoses(aspects: readonly number[], rect: Rect, zoomedOut: boolean) {
  const zoom = zoomedOut ? 1 : seeMoreRestZoom(rect.width)
  return aspects.map((aspect, index): FlightPose => ({
    corners: quadOf(seeMoreCellRect(rect, index, zoom)),
    texels: quadOf(coverCrop(aspect, 1)),
    radius: SEE_MORE_CELL_RADIUS * zoom,
    blend: 1,
  }))
}

/**
 * The overlay cells that fly back into the tile, by tile cell: in each masonry column, the first
 * four not scrolled up past `top`, or its last four near its end, into that column of the tile,
 * row by row. At the top of the overlay these are the tile's own photos; scrolled down, the photos
 * in view fly home and turn into the tile's on the way, so the close starts from what's on
 * screen. A cell whose photo hasn't loaded flies the tile's own photo from its place, and a short
 * column's missing cells fly the tile's own cells.
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
    // The 640px file if it is decoded, else whichever file the cell shows.
    const shown = img?.complete && img.naturalWidth > 0 ? img : undefined
    const image =
      heroIndex === undefined
        ? (decodedNow(img?.getAttribute('src') ?? '') ?? shown)
        : heroes[Number(heroIndex)]
    if (cell) return { cell, image: image ?? hero }
    const own = list.querySelector<HTMLElement>(`[data-hero-cell="${index}"]`)
    if (!own) throw new Error(`The See more overlay has no cell ${index}`)
    return { cell: own, image: hero }
  })
}

/** The tile's box, at `rect`, and its corner radius, which the flying cells are clipped to. */
function tileClip(tile: HTMLElement, rect: Rect) {
  return { rect, radius: cornerRadius(tile) }
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
    diagonal(viewportRect()),
    direction === 'open' ? 'farthest' : 'nearest',
  )
  return from.map((_, index) => lags.slice(index * 4, index * 4 + 4))
}

/**
 * Opens and closes the See more overlay. Where WebGPU runs, the tile's 16 photos fly out of its
 * cells into the first rows of the masonry columns, each corner on its own spring
 * (src/lib/gallery-flight.ts), led as a single photo's are. Closing flies them back into the
 * tile, turning around with their speed if the open is still under way, straight into the cells
 * as it shows them. They are clipped to the tile's rounded edge grown by how far they still are
 * from home, softened by half that, so the outer cells of the 2x crop slide under the tile's rim
 * as they land, and out from under it opening, in one motion. Scrolled down, the photos in view
 * fly home instead and turn into the tile's on the way (closingCells), so however long the list
 * grows, the close starts from what's on screen. Without WebGPU it fades.
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
  const returnTo = useRef<{ tile: HTMLElement; keyboard: boolean } | null>(null)
  /** Stops the opening run's notes still to come, so a quick close doesn't sound like an open. */
  const stopOpenRun = useRef<(() => void) | null>(null)

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
      setShown({ phase: 'open', flies: false, lifted: false })
      return
    }
    // The overlay mounts with the first cells empty, to be filled by the flight.
    setShown({ phase: 'opening', flies: true, lifted: false })
    // The overlay's cells take over from the flight, or replace it if it fails.
    const settle = () => {
      if (!current()) return
      setShown((shown) => (shown ? { ...shown, phase: 'open' } : shown))
      stage.hide(false)
    }
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
        // Keep the flight's last frame up until the cells can replace it, then swap them in one
        // commit. A flight cut short by a failure gives way to them at once.
        if (landed) {
          const images = cells.flatMap((cell) => [...cell.querySelectorAll('img')])
          await Promise.all(images.map((image) => image.decode().catch(() => {})))
        }
        settle()
      })
      .catch((error) => {
        console.warn('The See more overlay opened without its expand:', error)
        settle()
      })
  }

  /** `voiced` unless the close button asked: it carries its own cue, which bind() plays. */
  const closeOverlay = (voiced = true) => {
    if (!shown || shown.phase === 'closing') return
    stopOpenRun.current?.()
    if (voiced) play('close')
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
    // Mid-open, the overlay is at its top, so these are the tile's photos, still in the air, and
    // the flight turns them around where they are (Flight.flyCells).
    const flown = closingCells(list, 0, heroes)
    const sources = flown.map(({ image }) => image)
    const from = flown.map(({ cell }) => cellPose(cell))
    // Where the tile will be once the page behind the overlay has grown back.
    const tileRect = fullScaleRect(tile)
    const to = tilePoses(sources.map(imageAspect), tileRect, zoomedOutRef.current)
    // Measured first: the flown cells leave the overlay as it fades.
    for (const { cell } of flown) cell.setAttribute('data-lifted', '')
    const landing = flight.flyCells({
      photos: sources,
      into: heroes,
      from,
      to,
      lags: cellLags(from, to, 'close'),
      direction: 'close',
      clip: tileClip(tile, tileRect),
    })
    setShown({ ...shown, phase: 'closing', lifted: true })
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
    onOpenChange: (open: boolean, { reason, event }: Dialog.Root.ChangeEventDetails) => {
      if (open) {
        // A click from the keyboard (Enter or Space) has no click count.
        const keyboard = event instanceof MouseEvent ? event.detail === 0 : true
        const trigger = tileRef.current?.closest('button')
        returnTo.current = trigger ? { tile: trigger, keyboard } : null
        stopOpenRun.current = playOpenRun()
        openOverlay()
      }
      // The tile sits under the overlay once it opens, so a press on it can only be the second
      // click of a double click landing before the overlay did: that opens it, it doesn't close it.
      else if (reason !== 'trigger-press') closeOverlay(reason !== 'close-press')
    },
    close: closeOverlay,
    /**
     * For the popup's `finalFocus`: back to the See more tile, as keyboard focus only if a key
     * opened the overlay, since keyboard focus zooms the tile's grid out.
     */
    finalFocus: () => returnFocus(returnTo.current),
    prepare,
    /** The first cells are empty while the flight shows their photos. */
    cellsLifted: shown !== null && shown.phase !== 'open',
    closing: shown?.phase === 'closing',
    /** For GalleryOverlay's `flies`. */
    flies: shown?.flies ?? false,
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
  flightAirborne,
  closing,
  onClose,
  onOpenPhoto,
  finalFocus,
}: {
  /** Every photo, the See more tile's first. */
  photos: readonly GalleryPhoto[]
  /** Each photo's hover zoom, as the featured photos'. */
  photoTuning: PhotoZoomTuning
  listRef: RefObject<HTMLDivElement | null>
  /** Whether the tile's photos fly in; if not, they enter with the rest. */
  flies: boolean
  cellsLifted: boolean
  /** Whether any flight, this overlay's or a photo's opened from it, is drawn above it. */
  flightAirborne: boolean
  closing: boolean
  onClose: () => void
  onOpenPhoto: OpenPhoto
  /** Where focus goes when it closes (useSeeMoreOverlay's `finalFocus`). */
  finalFocus: () => boolean
}) {
  const columns = masonryColumns(
    photos.map((photo) => photo.height / photo.width),
    COLUMNS,
    ROWS,
  )
  const gap = 'gap-1.5 sm:gap-2'
  const popupRef = useRef<HTMLDivElement>(null)
  const glassBackdrop = useOverlayGlassBackdrop(listRef, popupRef)

  return (
    // Portalled to the body, outside main's stacking context, so it covers the Sunlit light and
    // the blind wand.
    <Dialog.Portal>
      <Dialog.Backdrop className={cn(galleryBackdropClass, closing && 'opacity-0 duration-200')} />
      {/* A click beside the photos closes it, as a click on an open photo closes that: from a
          photo opened in the grid, two clicks lead back to the page. */}
      <Dialog.Popup
        ref={popupRef}
        // The popup, not its first tabbable element: that's the first photo not flying in, further
        // down, or the close button at the end, and focusing either scrolls the list down to it.
        initialFocus={popupRef}
        finalFocus={finalFocus}
        className={cn(
          'fixed inset-0 z-50 cursor-zoom-out overflow-y-auto overscroll-contain transition-opacity duration-300 ease-out outline-none data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 motion-reduce:transition-none',
          // Closing, it lets clicks through: a photo opened from it now would fly in a closing dialog.
          closing && 'pointer-events-none opacity-0 duration-200',
        )}
        onClick={(event) => {
          // Not while the tile's photos are still flying in: a second click where See more was
          // would turn them straight back. Escape still can.
          if (cellsLifted) return
          if (event.target instanceof Element && !event.target.closest('button')) onClose()
        }}
      >
        <Dialog.Title className="sr-only">Gallery</Dialog.Title>
        {/* pb-28 lets the last row scroll clear of the close button. */}
        <div className="px-2 pt-2 pb-28 sm:px-4 sm:pt-4">
          {/* Shrinks behind a photo opened from it (src/lib/page-recede.ts). */}
          <div
            ref={listRef}
            data-recede
            className={cn(
              'grid grid-cols-4 items-start',
              gap,
              recedeClass,
              // Its photos open only once the tile's have landed, so a click can't cut the flight.
              cellsLifted && 'pointer-events-none',
            )}
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
        {/* Floats over the photos, which scroll under it. A flight draws above the whole dialog
            (z-60), so the button would sit under the flying photos and pop in front as they land:
            it waits out every flight and enters once they have handed over. */}
        <div
          className={cn(
            'fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 transition-[opacity,scale] duration-300 ease-out',
            (cellsLifted || flightAirborne) &&
              'pointer-events-none scale-90 opacity-0 duration-150 motion-reduce:scale-100',
          )}
        >
          {/* Live glass refracts the photos scrolling under it. */}
          <LiveGlassSourceProvider source={glassBackdrop}>
            <Dialog.Close
              render={
                <IconButton aria-label="Close gallery" size="4xl" glass="live" data-cuelume-close />
              }
            >
              <IconX aria-hidden="true" />
            </Dialog.Close>
          </LiveGlassSourceProvider>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  )
}

/**
 * What the close button's live glass sees: the overlay's photos near it, on the dialog's
 * backdrop, read as --surface-1 (the backdrop is that colour at 60% over the blurred page).
 * A photo lifted out for a flight is left out, as it is hidden.
 */
function useOverlayGlassBackdrop(
  listRef: RefObject<HTMLDivElement | null>,
  popupRef: RefObject<HTMLDivElement | null>,
): LiveGlassSource {
  return useMemo(
    () => ({
      scene(near) {
        const photos = []
        for (const image of listRef.current?.querySelectorAll('img') ?? []) {
          if (image.closest('[data-lifted]')) continue
          const rect = image.getBoundingClientRect()
          if (
            rect.right < near.left ||
            rect.left > near.right ||
            rect.bottom < near.top ||
            rect.top > near.bottom
          )
            continue
          photos.push({ image, rect, radius: 8 /* rounded-lg */ })
        }
        const background = getComputedStyle(document.documentElement)
          .getPropertyValue('--surface-1')
          .trim()
        return { background: background || 'white', photos }
      },
      subscribe(wake) {
        const popup = popupRef.current
        popup?.addEventListener('scroll', wake, { passive: true })
        return () => popup?.removeEventListener('scroll', wake)
      },
    }),
    [listRef, popupRef],
  )
}
