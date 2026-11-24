import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import type { CSSProperties } from 'react'

import cameraPhoto from '#/assets/camera/fujifilm-x-t30-iii.webp'
import { IconButton } from '#/components/ui/icon-button'
import { featuredCount, galleryPhotos } from '#/lib/gallery'
import type { GalleryPhoto } from '#/lib/gallery'
import { cn } from '#/lib/utils'

const tileClass = 'aspect-square w-full rounded-xl bg-neutral-200 dark:bg-neutral-800'

// The fanned stack's cards, back to front: rest pose, then spread on hover or focus.
const stackCards = [
  'rotate-[-9deg] -translate-x-[14%] group-hover:rotate-[-15deg] group-hover:-translate-x-[24%] group-focus-visible:rotate-[-15deg] group-focus-visible:-translate-x-[24%]',
  'rotate-[8deg] translate-x-[14%] group-hover:rotate-[14deg] group-hover:translate-x-[24%] group-focus-visible:rotate-[14deg] group-focus-visible:translate-x-[24%]',
  'rotate-[-2deg] group-hover:rotate-0 group-hover:-translate-y-[4%] group-focus-visible:rotate-0 group-focus-visible:-translate-y-[4%]',
]

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

function PhotoStack({ photos, total }: { photos: readonly GalleryPhoto[]; total: number }) {
  return (
    <Dialog.Trigger
      className={cn(
        tileClass,
        'group relative flex cursor-pointer flex-col items-center justify-center gap-3 bg-transparent outline-none dark:bg-transparent',
      )}
    >
      <span className="relative block aspect-[4/5] w-[52%]">
        {photos.slice(0, 3).map((photo, index) => (
          <img
            key={photo.id}
            src={photo.small}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn(
              'absolute inset-0 size-full rounded-md border-[3px] border-white bg-neutral-200 object-cover shadow-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:border-neutral-100',
              stackCards[index],
            )}
          />
        ))}
      </span>
      <span className="text-sm text-neutral-600 transition-colors duration-180 group-hover:text-neutral-950 dark:text-neutral-400 dark:group-hover:text-neutral-50">
        See all {total}
      </span>
    </Dialog.Trigger>
  )
}

/** The Gallery section: the camera, a few favourites, and a stack that opens every photo. */
function Gallery({
  photos,
  featuredCount,
}: {
  photos: readonly GalleryPhoto[]
  featuredCount: number
}) {
  const featured = photos.slice(0, featuredCount)
  const rest = photos.slice(featuredCount)

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
            <PhotoStack photos={rest} total={photos.length} />
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
