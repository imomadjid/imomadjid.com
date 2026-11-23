import { useEffect, useRef } from 'react'

import { cn } from '#/lib/utils'

/** One recording: VP9 WebM first, H.264 MP4 for browsers without WebM, and its first frame. */
export type VideoSource = { webm: string; mp4: string; poster: string }

/**
 * What a project's preview box shows. `dark` replaces `light` when the scene is dark; leave it
 * out when one version suits both. `className` paints the box behind an image (letterboxing).
 */
export type ProjectPreview =
  | { kind: 'video'; light: VideoSource; dark?: VideoSource }
  | { kind: 'image'; light: string; dark?: string; className?: string }

// The dark variant follows the Sunlit scene's tone, so each theme's copy hides with it.
const themeClass = { light: 'dark:hidden', dark: 'hidden dark:block' } as const

function themed<T>(light: T, dark: T | undefined) {
  return dark === undefined
    ? [{ source: light, className: '' }]
    : [
        { source: light, className: themeClass.light },
        { source: dark, className: themeClass.dark },
      ]
}

// Warming spends data on a guess, so skip it for visitors saving data. Only Chromium reports the
// connection; elsewhere warming stays on.
function savingData() {
  if (matchMedia('(prefers-reduced-data: reduce)').matches) return true
  const connection = navigator.connection
  return (
    connection?.saveData === true ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g'
  )
}

// A theme's hidden copy has no boxes; it stays paused and unloaded.
const visible = (element: Element) => element.getClientRects().length > 0

/**
 * Every project's media, stacked in the preview box. The `shown` project's layer is opaque and
 * the rest fade out, so moving between rows crossfades. Each layer is offset by `offsets[index]`,
 * the distance from the box's spot to its own row's spot, and eases there on the box's own curve
 * and duration. The two motions cancel, so each project's media
 * holds its place on the page while the box slides over it like a window. A fresh visit
 * (`instant`) places the layers without moving them, as the box fades in where it lands.
 *
 * Only the `playing` project's video plays, from the start each time its row is entered, and only
 * the copy for the current theme; with reduced motion the poster stays still. Videos load nothing
 * until then, except that the rows on either side of the playing one start buffering, since the
 * reader is likely to move there next. Posters are lazy images under each video rather than
 * `poster` attributes, which browsers fetch even for the hidden theme's copy.
 */
export function PreviewMedia({
  previews,
  shown,
  playing,
  offsets,
  instant,
}: {
  previews: readonly (ProjectPreview | undefined)[]
  shown: number | null
  playing: number | null
  offsets: readonly number[]
  instant: boolean
}) {
  const videos = useRef(new Map<HTMLVideoElement, number>())

  useEffect(() => {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const warm = playing !== null && !savingData()
    for (const [video, index] of videos.current) {
      if (index === playing && !reduceMotion && visible(video)) {
        video.currentTime = 0
        video.play().catch(() => {})
        continue
      }
      video.pause()
      if (warm && Math.abs(index - playing) === 1 && visible(video)) video.preload = 'auto'
    }
  }, [playing])

  return previews.map((preview, index) =>
    preview ? (
      <div
        // oxlint-disable-next-line react/no-array-index-key -- the list is static; its order is its identity
        key={index}
        className={cn(
          // Same curve, duration and reduced-motion fallback as the box's own move, so they cancel.
          'absolute inset-0 ease-[cubic-bezier(0.22,1,0.36,1)]',
          instant
            ? 'transition-none'
            : 'transition-[opacity,translate] duration-300 motion-reduce:transition-opacity',
          preview.kind === 'image' && preview.className,
          index === shown ? 'opacity-100' : 'opacity-0',
        )}
        style={{ translate: `0 ${offsets[index] ?? 0}px` }}
      >
        {preview.kind === 'video'
          ? themed(preview.light, preview.dark).map(({ source, className }) => (
              <div key={source.webm} className={cn('relative size-full', className)}>
                <img
                  src={source.poster}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                />
                <video
                  ref={(element) => {
                    if (!element) return
                    videos.current.set(element, index)
                    return () => {
                      videos.current.delete(element)
                    }
                  }}
                  muted
                  loop
                  playsInline
                  preload="none"
                  disablePictureInPicture
                  disableRemotePlayback
                  className="relative size-full object-cover"
                >
                  <source src={source.webm} type="video/webm" />
                  <source src={source.mp4} type="video/mp4" />
                </video>
              </div>
            ))
          : themed(preview.light, preview.dark).map(({ source, className }) => (
              <img
                key={source}
                src={source}
                alt=""
                loading="lazy"
                decoding="async"
                className={cn('size-full object-contain', className)}
              />
            ))}
      </div>
    ) : null,
  )
}
