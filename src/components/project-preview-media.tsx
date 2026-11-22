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
 * the rest fade out, so moving between rows crossfades. Each layer is offset by `offsets[index]`,
 * the distance from the box's spot to its own row's spot, and eases there on the box's own curve
 * and duration. The two motions cancel, so each project's media holds its place on the page while
 * the box slides over it like a window. A fresh visit (`instant`) places the layers without
 * moving them, as the box fades in where it lands. Only the `playing`
 * project's video plays, from the start each time its row is entered, and only the copy for the
 * current theme; with reduced motion the poster stays still.
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
