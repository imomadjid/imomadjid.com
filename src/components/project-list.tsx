import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'

import { cn } from '#/lib/utils'

export type Project = {
  name: string
  description: string
  /** The year the repository was created. */
  year: number
  /** The live site where there is one, otherwise the repository. */
  href: string
}

/** Which way the reader is moving through the list, so the preview can stay out of the way. */
type Direction = 'down' | 'up'

type Preview = {
  index: number
  direction: Direction
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
  descriptionRef,
  onEnter,
  onBlur,
}: {
  project: Project
  index: number
  muted: boolean
  titleRef: (element: HTMLSpanElement | null) => void
  descriptionRef: (element: HTMLSpanElement | null) => void
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
        {/* Measured for the preview, which hangs below it when the reader moves up. */}
        <span
          ref={descriptionRef}
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
 * Projects with one shared 16:9 preview that flies to the row being read and sits just after its
 * title. Moving down the list, the box rises from the title's text bottom so the rows below stay
 * readable; moving up, it hangs below the description so the rows above do. Either way the
 * active row's description stays readable. The first row
 * always takes it above and the last row below, where there are no rows to hide. The other rows
 * mute while one is active. Keyboard focus drives it the same way.
 */
export function ProjectList({ projects }: { projects: readonly Project[] }) {
  const listRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const titleRefs = useRef<(HTMLSpanElement | null)[]>([])
  const descriptionRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [preview, setPreview] = useState<Preview | null>(null)

  const enter = (index: number) => {
    const list = listRef.current?.getBoundingClientRect()
    const title = titleRefs.current[index]?.getBoundingClientRect()
    const description = descriptionRefs.current[index]?.getBoundingClientRect()
    const box = boxRef.current
    if (!list || !title || !description || !box) return

    const width = box.offsetWidth
    const height = box.offsetHeight
    const visiting = preview?.shown === true
    let direction: Direction
    // The ends have rows on one side only, so the box covers the other side.
    if (index === 0) direction = 'down'
    else if (index === projects.length - 1) direction = 'up'
    else if (visiting && index !== preview.index) direction = index > preview.index ? 'down' : 'up'
    else if (visiting) direction = preview.direction
    // A new visit has no direction yet: rise above the title unless that leaves the screen.
    else direction = title.bottom - height >= 0 ? 'down' : 'up'

    const maxX = window.innerWidth - viewportMargin - width - list.left
    const x = Math.max(0, Math.min(title.right - list.left + titleGap, maxX))
    const y =
      direction === 'down' ? title.bottom - list.top - height : description.bottom - list.top
    setPreview({ index, direction, x, y, shown: true, fresh: !visiting })
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
            descriptionRef={(element) => {
              descriptionRefs.current[index] = element
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
          'pointer-events-none absolute top-0 left-0 z-10 aspect-video w-[32rem] max-w-[calc(100vw-2rem)] rounded-xl bg-neutral-200 shadow-lg ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-neutral-800',
          preview?.shown ? 'opacity-100' : 'opacity-0',
          preview?.fresh || !preview?.shown
            ? 'transition-opacity duration-150'
            : 'transition-[opacity,transform] duration-300 motion-reduce:transition-opacity',
        )}
      />
    </div>
  )
}
