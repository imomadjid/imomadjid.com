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

/**
 * Every project's media, stacked in the preview box. The `shown` project's layer is opaque and
 * the rest fade out, so moving between rows crossfades. Only the `playing` project's video plays,
 * from the start each time its row is entered, and only the copy for the current theme; with
 * reduced motion the poster stays still.
 */
export function PreviewMedia({
  previews,
  shown,
  playing,
}: {
  previews: readonly (ProjectPreview | undefined)[]
  shown: number | null
  playing: number | null
}) {
  const videos = useRef(new Map<HTMLVideoElement, number>())

  useEffect(() => {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const [video, index] of videos.current) {
      // A theme's hidden copy has no boxes; it stays paused and unloaded.
      if (index === playing && !reduceMotion && video.getClientRects().length > 0) {
        video.currentTime = 0
        video.play().catch(() => {})
      } else video.pause()
    }
  }, [playing])

  return previews.map((preview, index) =>
    preview ? (
      <div
        // oxlint-disable-next-line react/no-array-index-key -- the list is static; its order is its identity
        key={index}
        className={cn(
          'absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none',
          preview.kind === 'image' && preview.className,
          index === shown ? 'opacity-100' : 'opacity-0',
        )}
      >
        {preview.kind === 'video'
          ? themed(preview.light, preview.dark).map(({ source, className }) => (
              <video
                key={source.webm}
                ref={(element) => {
                  if (!element) return
                  videos.current.set(element, index)
                  return () => {
                    videos.current.delete(element)
                  }
                }}
                poster={source.poster}
                muted
                loop
                playsInline
                preload="none"
                disablePictureInPicture
                disableRemotePlayback
                className={cn('size-full object-cover', className)}
              >
                <source src={source.webm} type="video/webm" />
                <source src={source.mp4} type="video/mp4" />
              </video>
            ))
          : themed(preview.light, preview.dark).map(({ source, className }) => (
              <img
                key={source}
                src={source}
                alt=""
                decoding="async"
                className={cn('size-full object-contain', className)}
              />
            ))}
      </div>
    ) : null,
  )
}
