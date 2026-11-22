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

/**
 * Where the reading line sits in the viewport. It holds the middle, where a section that has
 * crossed it fills most of the screen, but within half a screen of either end of the page it
 * slides to that edge with the scroll: the top of the page always reads the first section and
 * the bottom the last, even one too short to scroll up to the middle. A page that scrolls less
 * than a screen sweeps it evenly from edge to edge.
 */
function readingLine(scrolled: number, scrollable: number, height: number) {
  const half = height / 2
  const remaining = scrollable - scrolled
  if (scrollable < height) return (height * scrolled) / scrollable
  if (scrolled < half) return scrolled
  if (remaining < half) return height - remaining
  return half
}

/**
 * The section being read: the last one whose top has passed the reading line. It depends only
 * on the scroll position, so it never trusts a stale address. A page that doesn't scroll shows
 * every section at once, so there it is the one the address names.
 */
function readActive(sections: readonly PageSection[]) {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  if (scrollable <= 1) {
    return sections.find(({ id }) => location.hash === `#${id}`)?.id ?? sections[0]?.id
  }
  const scrolled = Math.min(scrollable, Math.max(0, window.scrollY))
  const point = readingLine(scrolled, scrollable, window.innerHeight)
  let active = sections[0]?.id
  for (const { id } of sections) {
    const top = document.getElementById(id)?.getBoundingClientRect().top
    if (top !== undefined && top <= point) active = id
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
              className="group inline-flex min-h-8 items-center text-neutral-400 transition-[color,font-weight] duration-300 hover:text-neutral-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 aria-[current=true]:font-semibold aria-[current=true]:text-neutral-950 motion-reduce:transition-none dark:text-neutral-600 dark:hover:text-neutral-50 dark:aria-[current=true]:text-neutral-50"
            >
              {Mark ? (
                <>
                  <Mark
                    aria-hidden="true"
                    className="h-3.5 w-auto [stroke-width:9.34] transition-[stroke-width] duration-300 group-aria-[current=true]:[stroke-width:12] motion-reduce:transition-none"
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
