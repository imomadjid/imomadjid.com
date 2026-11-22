import { useEffect, useState } from 'react'

/** A section of the page: `id` is its element's id, `label` its name in the contents. */
export type PageSection = { id: string; label: string }

// Below this fraction of the viewport's height, a section's top counts as reached.
const READING_LINE = 0.35

/**
 * The section being read. On a page that scrolls, it is the last one whose top has passed the
 * reading line, or the last one once the page is scrolled to its end. On a page that fits the
 * viewport, every section is in view, so it is the one the address names.
 */
function readActive(sections: readonly PageSection[]) {
  const first = sections[0]?.id
  const root = document.documentElement
  if (root.scrollHeight <= window.innerHeight + 1) {
    return sections.find(({ id }) => location.hash === `#${id}`)?.id ?? first
  }
  if (window.scrollY + window.innerHeight >= root.scrollHeight - 2) return sections.at(-1)?.id
  let active = first
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

  return (
    <nav
      aria-label="On this page"
      className="fixed top-1/2 left-8 z-10 hidden -translate-y-1/2 lg:block"
    >
      <ol className="animate-enter text-sm">
        {sections.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? 'true' : undefined}
              className="inline-flex min-h-8 items-center text-neutral-500 transition-colors duration-300 hover:text-neutral-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 aria-[current=true]:text-neutral-950 motion-reduce:transition-none dark:text-neutral-500 dark:hover:text-neutral-50 dark:aria-[current=true]:text-neutral-50"
            >
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
