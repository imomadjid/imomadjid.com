import { createFileRoute } from '@tanstack/react-router'
import { useDialKit, useDialKitController } from 'dialkit'

import { AmbientLight } from '#/components/ambient-light'
import { ProfileAvatar } from '#/components/profile-avatar'
import { ThemeToggle } from '#/components/theme-toggle'
import { LinkButton } from '#/components/ui/link-button'
import { ambientControls, defaultAmbientSettings } from '#/lib/ambient-settings'

const siteUrl = 'https://imomadjid.com/'
const title = 'Imo’s Portfolio'
const description =
  'I’m Imo, a design engineer and product designer based in Jakarta. I design and build interfaces, from early prototypes to shipped products.'
const ogImage = {
  url: `${siteUrl}og.png`,
  alt: 'Imo Madjid, design engineer and product designer in Jakarta',
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: title,
      inLanguage: 'en',
      publisher: { '@id': `${siteUrl}#person` },
    },
    {
      '@type': 'Person',
      '@id': `${siteUrl}#person`,
      name: 'Imo Madjid',
      alternateName: 'Imo',
      url: siteUrl,
      image: `${siteUrl}images/imo-avatar.webp`,
      jobTitle: 'Design engineer and product designer',
      worksFor: { '@type': 'Organization', name: 'DocDraft', url: 'https://docdraft.ai' },
      homeLocation: { '@type': 'Place', name: 'Jakarta, Indonesia' },
      sameAs: ['https://github.com/MassiveMassimo', 'https://www.linkedin.com/in/imomadjid/'],
    },
  ],
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      // The full name stays in the document title for search; shares use the shorter title.
      { title: 'Imo Madjid’s Portfolio' },
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: siteUrl },
      { property: 'og:site_name', content: 'Imo Madjid' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage.url },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: ogImage.alt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image:alt', content: ogImage.alt },
      { 'script:ld+json': structuredData },
    ],
    // The Worker also answers on workers.dev; the canonical keeps search results on the domain.
    links: [{ rel: 'canonical', href: siteUrl }],
  }),
  component: Home,
})

const productionTuning = { settings: defaultAmbientSettings, isSleeping: false }

function useDialTuning() {
  const sunlit = useDialKitController('Sunlit', ambientControls, {
    id: 'sunlit-tuning',
    persist: true,
    onAction(action) {
      if (action === 'reset') sunlit.resetValues()
    },
  })
  const profile = useDialKit('Profile', { isSleeping: false })
  return { settings: sunlit.values, isSleeping: profile.isSleeping }
}

// The build-time constant keeps hook order stable and drops DialKit from production.
const useTuning = import.meta.env.DEV ? useDialTuning : () => productionTuning

function Home() {
  const { settings, isSleeping } = useTuning()

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-6 py-16">
      <AmbientLight settings={settings} />
      <div data-sunlit-anchor className="relative z-10 w-full max-w-[34rem]">
        <h1 className="sr-only">Imo Madjid</h1>

        <div className="mb-10 flex animate-enter items-center justify-between gap-6">
          <ProfileAvatar isSleeping={isSleeping} />
          <ThemeToggle />
        </div>

        <div className="space-y-8 text-base leading-[1.8] text-neutral-600 transition-colors duration-300 motion-reduce:transition-none dark:text-neutral-400">
          <p className="animate-enter text-neutral-900 transition-colors duration-300 [--enter-index:1] motion-reduce:transition-none dark:text-neutral-100">
            I’m Imo, a design engineer and product designer based in Jakarta. I design and build
            interfaces, from early prototypes to shipped products.
          </p>

          <p className="animate-enter [--enter-index:2]">
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

          <p className="animate-enter [--enter-index:3]">
            I work across user research, design systems, and frontend engineering. I like working
            through interaction details in code, trying them out and refining how they feel.
          </p>

          <p className="animate-enter [--enter-index:4]">
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

        <footer className="mt-12 flex animate-enter flex-wrap items-center justify-between gap-x-10 gap-y-6 [--enter-index:5]">
          <img
            src="/images/signature.svg"
            alt="Imo’s signature"
            width={324}
            height={133}
            className="h-auto w-28 transition-[filter] duration-300 motion-reduce:transition-none dark:invert"
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
                key={label}
                href={href}
                className="inline-flex min-h-11 items-center text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-50"
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
