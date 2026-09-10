import { createFileRoute } from '@tanstack/react-router'

import { ThemeToggle } from '#/components/theme-toggle'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Imo Madjid — Design engineer & product designer' },
      {
        name: 'description',
        content:
          'I’m Imo, a design engineer and product designer based in Jakarta. I design interfaces and build them, from early prototypes to shipped products.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-[34rem]">
        <h1 className="sr-only">Imo Madjid</h1>

        <div className="mb-10 flex items-center justify-between gap-6">
          <div className="relative size-12 overflow-hidden rounded-full">
            <img
              src="/images/imo.png"
              alt="Imo smiling in a field of blue flowers"
              width={1086}
              height={1448}
              fetchPriority="high"
              className="absolute top-[-151%] left-[-73%] w-[230%] max-w-none"
            />
          </div>
          <ThemeToggle />
        </div>

        <div
          data-theme-color
          className="space-y-8 text-base leading-[1.8] text-neutral-600 dark:text-neutral-400"
        >
          <p data-theme-color className="text-neutral-900 dark:text-neutral-100">
            I’m Imo, a design engineer and product designer based in Jakarta. I design interfaces
            and build them, from early prototypes to shipped products.
          </p>

          <p>
            I’m currently a software engineer at DocDraft, working on document drafting and
            consultation tools. Before that, I was a UX engineer at Meeting.ai, where I designed and
            built experiences across web and mobile.
          </p>

          <p>
            My work spans user research, design systems, and frontend engineering. I like working
            through the details in code, seeing how an interaction feels, and refining it until it
            makes sense.
          </p>

          <p>
            I’ve also built native apps at the Apple Developer Academy. I’m always happy to talk
            about design, a product you’re building, or an idea you’d like to explore.
          </p>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
          <img
            src="/images/signature.svg"
            alt="Imo’s signature"
            width={324}
            height={133}
            className="h-auto w-28 dark:invert"
          />
          <nav
            aria-label="Contact and social links"
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
          >
            {[
              { label: 'Email', href: 'mailto:mhmmadjid@gmail.com' },
              { label: 'GitHub', href: 'https://github.com/MassiveMassimo' },
              { label: 'LinkedIn', href: 'https://www.linkedin.com/in/imomadjid/' },
            ].map(({ label, href }) => (
              <a
                data-theme-color
                key={label}
                href={href}
                className="inline-flex min-h-11 items-center text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-neutral-400 dark:hover:text-neutral-50"
              >
                {label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </main>
  )
}
