import { Dialog } from '@base-ui/react/dialog'
import { useLayoutEffect, useRef } from 'react'

import cameraPhoto from '#/assets/camera/fujifilm-x-t30-iii.webp'
import { useFlightStage } from '#/components/gallery-flight-stage'
import { useGalleryLightbox } from '#/components/gallery-lightbox'
import { GalleryOverlay, useSeeMoreOverlay } from '#/components/gallery-overlay'
import { FeaturedPhoto } from '#/components/gallery-photo-tile'
import type { OpenPhoto } from '#/components/gallery-photo-tile'
import { SeeMoreTile } from '#/components/gallery-see-more'
import { useOverlayColumns } from '#/components/use-overlay-columns'
import { useOverlayScrollsPage } from '#/lib/dialog-layer'
import { figuresClass } from '#/lib/figures'
import { featuredCount, galleryPhotos } from '#/lib/gallery'
import type { GalleryPhoto } from '#/lib/gallery'
import { tileCells } from '#/lib/gallery-masonry'
import { galleryTuning } from '#/lib/gallery-settings'
import { recedePage } from '#/lib/page-recede'

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

/** The Gallery section: the camera, the favourites, and a tile that opens every photo. */
function Gallery({
  photos,
  featuredCount,
}: {
  photos: readonly GalleryPhoto[]
  featuredCount: number
}) {
  const featured = photos.slice(0, featuredCount)
  // The overlay's order: the photos past the featured ones first, so the See more tile can
  // preview what the page doesn't show yet. Its grid, as many cells square as the overlay has
  // columns, is the overlay's rows from tileCells' start row.
  const overlayPhotos = [...photos.slice(featuredCount), ...featured]
  const columns = useOverlayColumns()
  const tile = tileCells(columns)
  const preview = overlayPhotos.slice(tile.start, tile.end)
  const sectionRef = useRef<HTMLDivElement>(null)
  const tileRef = useRef<HTMLSpanElement>(null)
  const zoomedOutRef = useRef(false)
  const stage = useFlightStage(galleryTuning.expand, sectionRef)
  const lightbox = useGalleryLightbox(stage, galleryTuning)
  // An open photo steps through the photos around its tile: the featured ones on the page, or
  // every photo in the overlay, in its order.
  const openFeatured: OpenPhoto = (photo, tile, keyboard) =>
    lightbox.openPhoto(photo, tile, keyboard, featured)
  const openInOverlay: OpenPhoto = (photo, tile, keyboard) =>
    lightbox.openPhoto(photo, tile, keyboard, overlayPhotos)
  const scrollsPage = useOverlayScrollsPage()
  const overlay = useSeeMoreOverlay({
    stage,
    photos: preview,
    columns,
    tileRef,
    zoomedOutRef,
    scrollsPage,
  })

  // The page shrinks behind an open photo or the overlay, and grows back as either starts to
  // close, so a photo flying home lands on a page already on its way back. A photo opened from
  // the overlay shrinks the overlay's photos behind it the same way, a layer further back.
  const holdingTile = lightbox.holdingTile
  const receded = (overlay.open && !overlay.closing) || holdingTile !== null
  useLayoutEffect(() => {
    if (sectionRef.current) recedePage(sectionRef.current, receded, galleryTuning.recede)
  }, [receded])
  const { listRef } = overlay
  useLayoutEffect(() => {
    const list = listRef.current
    if (list)
      recedePage(list, holdingTile !== null && list.contains(holdingTile), galleryTuning.recede)
  }, [holdingTile, listRef])
  useLayoutEffect(() => {
    const section = sectionRef.current
    return () => {
      if (section) recedePage(section, false, galleryTuning.recede)
    }
  }, [])

  return (
    <Dialog.Root
      open={overlay.open}
      onOpenChange={overlay.onOpenChange}
      onOpenChangeComplete={overlay.onOpenChangeComplete}
      // The page scrolls the overlay on touch screens, so it mustn't lock.
      modal={scrollsPage ? 'trap-focus' : true}
    >
      {/* Inside the See more dialog's root, so a photo opened from its grid nests in it: closing
          the photo returns to the grid. */}
      {lightbox.element}
      <div ref={sectionRef} className="flex flex-col gap-10">
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
        <ul data-gallery-set className="grid w-full grid-cols-3 gap-2">
          {featured.map((photo) => (
            <li key={photo.id}>
              <FeaturedPhoto photo={photo} tuning={galleryTuning.photo} onOpen={openFeatured} />
            </li>
          ))}
          <li>
            <SeeMoreTile
              photos={preview}
              columns={columns}
              total={photos.length}
              tuning={galleryTuning.seeMore}
              tileRef={tileRef}
              zoomedOutRef={zoomedOutRef}
              onIntent={overlay.prepare}
            />
          </li>
        </ul>
      </div>

      <GalleryOverlay
        photos={overlayPhotos}
        columns={columns}
        scrollsPage={scrollsPage}
        photoTuning={galleryTuning.photo}
        listRef={overlay.listRef}
        flies={overlay.flies}
        cellsLifted={overlay.cellsLifted}
        flightAirborne={stage.airborne}
        closing={overlay.closing}
        onClose={overlay.close}
        onOpenPhoto={openInOverlay}
        finalFocus={overlay.finalFocus}
      />
      {stage.canvas}
    </Dialog.Root>
  )
}

/** The Gallery with its photos. Default export for `lazy`, which keeps it out of production. */
export default function GallerySection() {
  return <Gallery photos={galleryPhotos} featuredCount={featuredCount} />
}
