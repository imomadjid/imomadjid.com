import { createFileRoute } from '@tanstack/react-router'
import { useDialKit, useDialKitController } from 'dialkit'

import { AmbientLight } from '#/components/ambient-light'
import { ProfileAvatar } from '#/components/profile-avatar'
import { ThemeToggle } from '#/components/theme-toggle'
import { LinkButton } from '#/components/ui/link-button'
import { ambientControls } from '#/lib/ambient-settings'

import '../sunlit.css'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Imo Madjid, design engineer and product designer' },
      {
        name: 'description',
        content:
          'I’m Imo, a design engineer and product designer based in Jakarta. I design and build interfaces, from early prototypes to shipped products.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  const sunlit = useDialKitController('Sunlit', ambientControls, {
    id: 'sunlit-tuning',
    persist: import.meta.env.DEV,
    onAction(action) {
      if (action === 'reset') sunlit.resetValues()
    },
  })
  const profile = useDialKit('Profile', { isSleeping: false })
  const isSleeping = import.meta.env.DEV && profile.isSleeping

  return (
    <main className="sunlit-study relative isolate flex min-h-svh items-center justify-center overflow-hidden px-6 py-16">
      <AmbientLight settings={sunlit.values} />
      <div className="relative z-10 w-full max-w-[34rem]">
        <h1 className="sr-only">Imo Madjid</h1>

        <div className="mb-10 flex items-center justify-between gap-6">
          <ProfileAvatar isSleeping={isSleeping} />
          <ThemeToggle />
        </div>

        <div
          data-theme-color
          className="space-y-8 text-base leading-[1.8] text-neutral-600 dark:text-neutral-400"
        >
          <p data-theme-color className="text-neutral-900 dark:text-neutral-100">
            I’m Imo, a design engineer and product designer based in Jakarta. I design and build
            interfaces, from early prototypes to shipped products.
          </p>

          <p>
            I’m a software engineer at{' '}
            <LinkButton href="https://docdraft.ai" logoSrc="/images/companies/docdraft.svg">
              DocDraft
            </LinkButton>
            , working on document drafting and consultation tools. Before that, I was a UX engineer
            at{' '}
            <LinkButton href="https://meeting.ai" logoSrc="/images/companies/meeting-ai.png">
              Meeting.ai
            </LinkButton>
            , where I designed and built experiences across web and mobile.
          </p>

          <p>
            I work across user research, design systems, and frontend engineering. I like working
            through interaction details in code, trying them out and refining how they feel.
          </p>

          <p>
            I’ve also built native apps at the{' '}
            <LinkButton
              href="https://developer.apple.com/academies/"
              logoSrc="/images/companies/apple.svg"
              invertLogo
            >
              Apple Developer Academy
            </LinkButton>
            . I’m happy to talk about design, a product you’re building, or an idea you’d like to
            explore.
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
