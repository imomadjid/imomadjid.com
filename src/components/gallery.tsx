import { Dialog } from '@base-ui/react/dialog'
import { useDialKit } from 'dialkit'
import { useLayoutEffect, useRef } from 'react'

import cameraPhoto from '#/assets/camera/fujifilm-x-t30-iii.webp'
import { useFlightStage } from '#/components/gallery-flight-stage'
import { useGalleryLightbox } from '#/components/gallery-lightbox'
import { GalleryOverlay, useSeeMoreOverlay } from '#/components/gallery-overlay'
import { FeaturedPhoto } from '#/components/gallery-photo-tile'
import { SeeMoreTile } from '#/components/gallery-see-more'
import type { SeeMoreTileControl } from '#/components/gallery-see-more'
import { featuredCount, galleryPhotos } from '#/lib/gallery'
import type { GalleryPhoto } from '#/lib/gallery'
import { defaultGalleryTuning, galleryControls } from '#/lib/gallery-settings'
import { recedePage } from '#/lib/page-recede'

// The build-time constant keeps hook order stable and drops DialKit from production.
const useGalleryTuning = import.meta.env.DEV_TOOLS
  ? () => useDialKit('Gallery', galleryControls)
  : () => defaultGalleryTuning

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
  // preview what the page doesn't show yet. Its 16 are the overlay's first.
  const overlayPhotos = [...photos.slice(featuredCount), ...featured]
  const preview = overlayPhotos.slice(0, 16)
  const tuning = useGalleryTuning()
  const sectionRef = useRef<HTMLDivElement>(null)
  const tileRef = useRef<HTMLSpanElement>(null)
  const zoomedOutRef = useRef(false)
  const stage = useFlightStage(tuning.expand, sectionRef)
  const lightbox = useGalleryLightbox(stage)
  const tileControlRef = useRef<SeeMoreTileControl>(null)
  const overlay = useSeeMoreOverlay({
    stage,
    photos: preview,
    tileRef,
    zoomedOutRef,
    tileControlRef,
  })

  // The page shrinks behind an open photo or the overlay, and grows back as either starts to
  // close, so a photo flying home lands on a page already on its way back. A photo opened from
  // the overlay shrinks the overlay's photos behind it the same way, a layer further back.
  const holdingTile = lightbox.holdingTile
  const receded = (overlay.open && !overlay.closing) || holdingTile !== null
  useLayoutEffect(() => {
    if (sectionRef.current) recedePage(sectionRef.current, receded, tuning.recede)
  }, [receded, tuning.recede])
  const { listRef } = overlay
  useLayoutEffect(() => {
    const list = listRef.current
    if (list) recedePage(list, holdingTile !== null && list.contains(holdingTile), tuning.recede)
  }, [holdingTile, listRef, tuning.recede])
  useLayoutEffect(() => {
    const section = sectionRef.current
    return () => {
      if (section) recedePage(section, false, defaultGalleryTuning.recede)
    }
  }, [])

  return (
    <Dialog.Root open={overlay.open} onOpenChange={overlay.onOpenChange}>
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
        <ul className="grid w-full grid-cols-3 gap-2">
          {featured.map((photo) => (
            <li key={photo.id}>
              <FeaturedPhoto photo={photo} tuning={tuning.photo} onOpen={lightbox.openPhoto} />
            </li>
          ))}
          <li>
            <SeeMoreTile
              photos={preview}
              total={photos.length}
              tuning={tuning.seeMore}
              tileRef={tileRef}
              zoomedOutRef={zoomedOutRef}
              onIntent={overlay.prepare}
              controlRef={tileControlRef}
            />
          </li>
        </ul>
      </div>

      <GalleryOverlay
        photos={overlayPhotos}
        listRef={overlay.listRef}
        flies={stage.ready}
        cellsLifted={overlay.cellsLifted}
        closing={overlay.closing}
        onClose={overlay.close}
        onOpenPhoto={lightbox.openPhoto}
      />
      {stage.canvas}
    </Dialog.Root>
  )
}

/** The Gallery with its photos. Default export for `lazy`, which keeps it out of production. */
export default function GallerySection() {
  return <Gallery photos={galleryPhotos} featuredCount={featuredCount} />
}
