import { useRef } from 'react'

import { FluidHoverHighlight } from '#/components/fluid-hover-highlight'
import { useFluidHover, useRegisterFluidHoverItem } from '#/hooks/use-fluid-hover'
import type { UseFluidHoverReturn } from '#/hooks/use-fluid-hover'

export type Project = {
  name: string
  description: string
  /** The year the repository was created. */
  year: number
  /** The live site where there is one, otherwise the repository. */
  href: string
}

/**
 * One row: the whole row is the link. It registers with the list so the shared highlight can
 * measure it, and reports focus so the keyboard moves the highlight too.
 */
function ProjectRow({
  project,
  index,
  registerItem,
  onFocus,
  onBlur,
}: {
  project: Project
  index: number
  registerItem: UseFluidHoverReturn['registerItem']
  onFocus: (index: number) => void
  onBlur: (next: EventTarget | null) => void
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  useRegisterFluidHoverItem(registerItem, index, ref)

  return (
    <li>
      <a
        ref={ref}
        href={project.href}
        onFocus={() => onFocus(index)}
        onBlur={(event) => onBlur(event.relatedTarget)}
        className="relative z-10 block rounded-2xl px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <span className="flex items-baseline justify-between gap-6">
          <span className="font-medium text-neutral-900 transition-colors duration-300 motion-reduce:transition-none dark:text-neutral-100">
            {project.name}
          </span>
          {/* Allo's open figures (ss03), slashed zero, and tabular figures. */}
          <span className="[font-feature-settings:'ss03'] text-sm text-neutral-500 slashed-zero tabular-nums">
            {project.year}
          </span>
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-neutral-600 transition-colors duration-300 motion-reduce:transition-none dark:text-neutral-400">
          {project.description}
        </span>
      </a>
    </li>
  )
}

/**
 * Projects as a list whose hover fill glides between rows (Fluid Functionalism's fluid hover).
 * Keyboard focus drives the same fill. The rows bleed past the column by their padding, so the
 * text lines up with the paragraphs above.
 */
export function ProjectList({ projects }: { projects: readonly Project[] }) {
  const listRef = useRef<HTMLDivElement>(null)
  const hover = useFluidHover(listRef)
  const { handlers, registerItem, setActiveIndex } = hover

  return (
    // The pointer tracking sits on a wrapper so the list holds only its rows, the fill beside it.
    // It's a visual effect; the rows are plain links that work without it.
    <div
      ref={listRef}
      onMouseEnter={handlers.onMouseEnter}
      onMouseMove={handlers.onMouseMove}
      onMouseLeave={handlers.onMouseLeave}
      className="relative -mx-3"
    >
      {/* The fill's classes are spelled out here because production CSS doesn't scan the
          registry files. Neutral alphas rather than bg-hover: dark: follows the Sunlit scene,
          the token follows the instant theme class. */}
      <FluidHoverHighlight
        hover={hover}
        className="pointer-events-none absolute top-0 left-0 rounded-2xl bg-black/4 dark:bg-white/6"
      />
      <ul className="flex flex-col gap-0.5">
        {projects.map((project, index) => (
          <ProjectRow
            key={project.href}
            project={project}
            index={index}
            registerItem={registerItem}
            onFocus={setActiveIndex}
            onBlur={(next) => {
              // Focus moving to another row keeps the highlight, which glides there instead.
              if (next instanceof Node && listRef.current?.contains(next)) return
              setActiveIndex(null)
            }}
          />
        ))}
      </ul>
    </div>
  )
}
