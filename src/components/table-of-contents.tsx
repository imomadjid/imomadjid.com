import { useEffect, useState } from 'react'
import type { ComponentType, SVGProps } from 'react'

/**
 * A section of the page: `id` is its element's id, `label` its name in the contents. A `mark`
 * shows in place of the label, which screen readers still announce.
 */
export type PageSection = {
  id: string
  label: string
  mark?: ComponentType<SVGProps<SVGSVGElement>>
}

// Below this fraction of the viewport's height, a section's top counts as reached.
const READING_LINE = 0.35

/**
 * The section being read: the last one whose top has passed the reading line. At either end of
 * the page the line can't reach every section, so there the section last linked to wins while
 * it is on screen, or else the first one at the top and the last one at the bottom. A page that
 * fits the viewport is at both ends at once.
 */
function readActive(sections: readonly PageSection[]) {
  const root = document.documentElement
  const atTop = window.scrollY <= 0
  const atBottom = window.scrollY + window.innerHeight >= root.scrollHeight - 2
  if (atTop || atBottom) {
    const linked = sections.find(({ id }) => location.hash === `#${id}`)?.id
    const box = linked && document.getElementById(linked)?.getBoundingClientRect()
    if (linked && box && box.bottom > 0 && box.top < window.innerHeight) return linked
    return atTop ? sections[0]?.id : sections.at(-1)?.id
  }
  let active = sections[0]?.id
  for (const { id } of sections) {
    const top = document.getElementById(id)?.getBoundingClientRect().top
    if (top !== undefined && top <= window.innerHeight * READING_LINE) active = id
  }
  return active
}

function useActiveSection(sections: readonly PageSection[]) {
  const [active, setActive] = useState<string | undefined>(sections[0]?.id)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setActive(readActive(sections))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const listeners = new AbortController()
    const options = { passive: true, signal: listeners.signal }
    window.addEventListener('scroll', schedule, options)
    window.addEventListener('resize', schedule, options)
    window.addEventListener('hashchange', schedule, options)
    schedule()
    return () => {
      listeners.abort()
      cancelAnimationFrame(frame)
    }
  }, [sections])

  return active
}

/**
 * Contents of the page, fixed to its left edge on wide viewports. The links are plain anchors,
 * so they work before hydration; `aria-current` marks the section being read.
 */
export function TableOfContents({ sections }: { sections: readonly PageSection[] }) {
  const active = useActiveSection(sections)
  // One section is the whole page, with nowhere to go.
  if (sections.length < 2) return null

  return (
    <nav
      aria-label="On this page"
      className="fixed top-1/2 left-8 z-10 hidden -translate-y-1/2 lg:block"
    >
      <ol className="animate-enter text-sm">
        {sections.map(({ id, label, mark: Mark }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? 'true' : undefined}
              className="inline-flex min-h-8 items-center text-neutral-500 transition-[color,font-weight,--embolden] duration-300 hover:text-neutral-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 aria-[current=true]:font-semibold aria-[current=true]:text-neutral-950 aria-[current=true]:[--embolden:0.55px] motion-reduce:transition-none dark:text-neutral-500 dark:hover:text-neutral-50 dark:aria-[current=true]:text-neutral-50"
            >
              {Mark ? (
                <>
                  <Mark
                    aria-hidden="true"
                    className="h-3.5 w-auto overflow-visible [stroke:currentColor] [stroke-width:var(--embolden)] [stroke-linejoin:round]"
                  />
                  <span className="sr-only">{label}</span>
                </>
              ) : (
                label
              )}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
