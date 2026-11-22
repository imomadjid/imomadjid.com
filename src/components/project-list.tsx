import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

import { PreviewMedia } from '#/components/project-preview-media'
import type { ProjectPreview } from '#/components/project-preview-media'
import { playRowTick } from '#/lib/project-list-sounds'
import { unlockSoundsOnGesture } from '#/lib/theme-sounds'
import { cn } from '#/lib/utils'

export type Project = {
  name: string
  description: string
  /** The year the repository was created. */
  year: number
  /** The live site where there is one, otherwise the repository. */
  href: string
  /** What the hover preview shows; without one the box stays a plain placeholder. */
  preview?: ProjectPreview
}

type Preview = {
  index: number
  x: number
  y: number
  /** False after the pointer leaves: the box fades out where it last was. */
  shown: boolean
  /** True for the first frame of a visit, so the box fades in in place instead of flying. */
  fresh: boolean
}

// Space between the end of a title and the preview, in px.
const titleGap = 12
// The preview keeps this far from the viewport's right edge, in px.
const viewportMargin = 16

function ProjectRow({
  project,
  index,
  muted,
  titleRef,
  onEnter,
  onBlur,
}: {
  project: Project
  index: number
  muted: boolean
  titleRef: (element: HTMLSpanElement | null) => void
  onEnter: (index: number) => void
  onBlur: (next: EventTarget | null) => void
}) {
  return (
    <li>
      <a
        href={project.href}
        onPointerEnter={(event: PointerEvent) => {
          // A tap navigates; there is nothing to preview first.
          if (event.pointerType !== 'touch') onEnter(index)
        }}
        onFocus={() => onEnter(index)}
        onBlur={(event) => onBlur(event.relatedTarget)}
        className="block rounded-lg py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <span className="flex items-baseline justify-between gap-6">
          <span
            className={cn(
              'font-medium transition-colors duration-200 motion-reduce:transition-none',
              muted
                ? 'text-neutral-400 dark:text-neutral-600'
                : 'text-neutral-900 dark:text-neutral-100',
            )}
          >
            {/* Measured for the preview: leading-none makes its box the text's own top and
                bottom, so the preview lines up with the letters, not the line's leading. */}
            <span ref={titleRef} className="inline-block leading-none">
              {project.name}
            </span>
          </span>
          {/* Allo's open figures (ss03), slashed zero, and tabular figures. */}
          <span
            className={cn(
              "[font-feature-settings:'ss03'] text-sm slashed-zero tabular-nums transition-colors duration-200 motion-reduce:transition-none",
              muted ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-500',
            )}
          >
            {project.year}
          </span>
        </span>
        <span
          className={cn(
            'mt-0.5 block text-sm leading-relaxed transition-colors duration-200 motion-reduce:transition-none',
            muted
              ? 'text-neutral-400 dark:text-neutral-600'
              : 'text-neutral-600 dark:text-neutral-400',
          )}
        >
          {project.description}
        </span>
      </a>
    </li>
  )
}

/**
 * Projects with one shared 16:9 preview that flies to the row being read. It sits just after the
 * title, its bottom on the title's text bottom, so it rises over the rows above and leaves the
 * row's description readable. The other rows mute while one is active. Keyboard focus drives it
 * the same way, and a soft tick marks each row the reader lands on, entering the list included,
 * pitched up when moving up the list.
 */
export function ProjectList({ projects }: { projects: readonly Project[] }) {
  const listRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const titleRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [preview, setPreview] = useState<Preview | null>(null)
  // The media mounts once the list nears the viewport, so posters are ready by the first hover
  // without loading them for visitors who never scroll this far. Videos load only when played.
  const [mediaReady, setMediaReady] = useState(false)

  // Hover and focus aren't gestures, so the row ticks can't start audio; the next press does.
  useEffect(() => unlockSoundsOnGesture(), [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setMediaReady(true)
        observer.disconnect()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  const enter = (index: number) => {
    const list = listRef.current?.getBoundingClientRect()
    const title = titleRefs.current[index]?.getBoundingClientRect()
    const box = boxRef.current
    if (!list || !title || !box) return

    const width = box.offsetWidth
    const height = box.offsetHeight
    const visiting = preview?.shown === true
    // Every new row ticks, the first one of a visit too; staying on a row doesn't.
    if (!visiting || index !== preview.index) {
      playRowTick(visiting && index < preview.index ? 'up' : 'down')
    }

    const maxX = window.innerWidth - viewportMargin - width - list.left
    const x = Math.max(0, Math.min(title.right - list.left + titleGap, maxX))
    // The box's bottom sits on the title's text bottom, so the row's description stays readable.
    const y = title.bottom - list.top - height
    setPreview({ index, x, y, shown: true, fresh: !visiting })
  }

  const leave = () => setPreview((current) => current && { ...current, shown: false })

  const active = preview?.shown ? preview.index : null

  return (
    <div ref={listRef} onPointerLeave={leave} className="relative">
      <ul className="flex flex-col">
        {projects.map((project, index) => (
          <ProjectRow
            key={project.href}
            project={project}
            index={index}
            muted={active !== null && active !== index}
            titleRef={(element) => {
              titleRefs.current[index] = element
            }}
            onEnter={enter}
            onBlur={(next) => {
              // Focus moving to another row keeps the preview, which flies there instead.
              if (next instanceof Node && listRef.current?.contains(next)) return
              leave()
            }}
          />
        ))}
      </ul>
      {/* The preview. It stays mounted, hidden, so it can be measured before its first visit. */}
      <div
        ref={boxRef}
        aria-hidden="true"
        style={{ transform: `translate(${preview?.x ?? 0}px, ${preview?.y ?? 0}px)` }}
        className={cn(
          'pointer-events-none absolute top-0 left-0 z-10 aspect-video w-[32rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-neutral-200 shadow-lg ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-neutral-800',
          preview?.shown ? 'opacity-100' : 'opacity-0',
          preview?.fresh || !preview?.shown
            ? 'transition-opacity duration-150'
            : 'transition-[opacity,transform] duration-300 motion-reduce:transition-opacity',
        )}
      >
        {/* The last row's media stays while the box fades out; only the active row's plays. */}
        {mediaReady && (
          <PreviewMedia
            previews={projects.map((project) => project.preview)}
            shown={preview?.index ?? null}
            playing={active}
          />
        )}
      </div>
    </div>
  )
}
