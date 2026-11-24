import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { useDialKit } from 'dialkit'
import { useRef } from 'react'
import type { CSSProperties } from 'react'

import cameraPhoto from '#/assets/camera/fujifilm-x-t30-iii.webp'
import { useGalleryLightbox } from '#/components/gallery-lightbox'
import { FeaturedPhoto } from '#/components/gallery-photo-tile'
import { SeeMoreTile } from '#/components/gallery-see-more'
import { IconButton } from '#/components/ui/icon-button'
import { featuredCount, galleryPhotos } from '#/lib/gallery'
import type { GalleryPhoto } from '#/lib/gallery'
import { defaultGalleryTuning, galleryControls } from '#/lib/gallery-settings'

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

// Overlay photos past this index enter together, so a long list doesn't trail in.
const maxStagger = 12

function enterIndex(index: number): CSSProperties & { '--enter-index': number } {
  return { '--enter-index': Math.min(index, maxStagger) }
}

// The See more tile's preview: the photos past the grid, then from the top, 16 in all.
function previewPhotos(photos: readonly GalleryPhoto[], featuredCount: number) {
  return [...photos.slice(featuredCount), ...photos.slice(0, featuredCount)].slice(0, 16)
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
  const tuning = useGalleryTuning()
  const sectionRef = useRef<HTMLDivElement>(null)
  const lightbox = useGalleryLightbox(tuning.expand, sectionRef)

  return (
    <Dialog.Root>
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
              photos={previewPhotos(photos, featuredCount)}
              total={photos.length}
              tuning={tuning.seeMore}
            />
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
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    className="block w-full cursor-zoom-in overflow-hidden rounded-lg bg-neutral-200 data-lifted:invisible dark:bg-neutral-800"
                    onClick={(event) => lightbox.openPhoto(photo, event.currentTarget)}
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
                      className="block h-auto w-full"
                    />
                  </button>
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
