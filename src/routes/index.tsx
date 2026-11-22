import { createFileRoute } from '@tanstack/react-router'
import { useDialKit, useDialKitController } from 'dialkit'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { AmbientLight } from '#/components/ambient-light'
import { BlindWand } from '#/components/blind-wand'
import { Logo } from '#/components/logo'
import { ProfileAvatar } from '#/components/profile-avatar'
import { ProjectList } from '#/components/project-list'
import type { Project } from '#/components/project-list'
import { Signature } from '#/components/signature'
import { TableOfContents } from '#/components/table-of-contents'
import type { PageSection } from '#/components/table-of-contents'
import { LinkButton } from '#/components/ui/link-button'
import { ambientControls, defaultAmbientSettings } from '#/lib/ambient-settings'
import { defaultSignatureTiming, signatureControls } from '#/lib/signature-settings'
import { textLinkClass } from '#/lib/text-link'
import { cn } from '#/lib/utils'

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
      sameAs: ['https://github.com/imomadjid', 'https://www.linkedin.com/in/imomadjid/'],
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

// Public repos, newest first. Each links to its live site where there is one.
const projects = [
  {
    name: 'antijank',
    description:
      'Headless animation review for coding agents. It reports jank as text, with no screenshots.',
    year: 2026,
    href: 'https://github.com/imomadjid/antijank',
  },
  {
    name: 'Krillion Bench',
    description: 'A general knowledge benchmark for LLMs on Krillion.io.',
    year: 2026,
    href: 'https://github.com/imomadjid/krillion-bench',
  },
  {
    name: 'Book n Quill',
    description: 'A playful notepad with a Minecraft Java Book and Quill interface.',
    year: 2026,
    href: 'https://book-n-quill.mhmmadjid.workers.dev',
  },
  {
    name: 'Lukis',
    description: 'A local-first painterly image editor, built with Astro and WebGPU.',
    year: 2026,
    href: 'https://lukis.imomadjid.com',
  },
  {
    name: 'Influencer Tracker',
    description:
      'Scores finfluencers’ stock calls on Instagram and X against real forward prices, versus SPY.',
    year: 2026,
    href: 'https://influencer-tracker-beta.vercel.app',
  },
  {
    name: 'Binsight',
    description: 'An iPhone app that uses vision machine learning to help sort trash.',
    year: 2025,
    href: 'https://github.com/imomadjid/Binsight',
  },
  {
    name: 'Name a Woman',
    description:
      'A 60-second game: name as many women as you can, and each one joins a tally everyone shares.',
    year: 2024,
    href: 'https://github.com/imomadjid/name-a-woman',
  },
] as const satisfies readonly Project[]

// Sections still being built. They show only with the dev tools, so merging dev into master
// never puts them on imomadjid.com. Gallery and Guestbook are empty stand-ins for now.
const draftSections = [
  { id: 'projects', label: 'Random bullshit' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'guestbook', label: 'Guestbook' },
] as const satisfies readonly PageSection[]

// One list names the page's sections for both their headings and the table of contents.
const sections = [
  { id: 'about', label: 'About', mark: Logo },
  ...(import.meta.env.DEV_TOOLS ? draftSections : []),
] as const satisfies readonly PageSection[]

type SectionId = (typeof sections)[number]['id']

/** A titled region of the page. Its heading is for assistive tech; the contents show it. */
function Section({
  id,
  className,
  children,
}: {
  id: SectionId
  className?: string
  children: ReactNode
}) {
  const headingId = `${id}-heading`
  return (
    <section id={id} aria-labelledby={headingId} className={cn('scroll-mt-16', className)}>
      <h2 id={headingId} className="sr-only">
        {sections.find((entry) => entry.id === id)?.label}
      </h2>
      {children}
    </section>
  )
}

const productionTuning = {
  settings: defaultAmbientSettings,
  isSleeping: false,
  signatureTiming: defaultSignatureTiming,
  signatureRun: 0,
}

function useDialTuning() {
  const sunlit = useDialKitController('Sunlit', ambientControls, {
    id: 'sunlit-tuning',
    persist: true,
    onAction(action) {
      if (action === 'reset') sunlit.resetValues()
    },
  })
  const profile = useDialKit('Profile', { isSleeping: false })
  const [signatureRun, setSignatureRun] = useState(0)
  const signature = useDialKit('Signature', signatureControls, {
    onAction(action) {
      if (action === 'replay') setSignatureRun((run) => run + 1)
    },
  })
  return {
    settings: sunlit.values,
    isSleeping: profile.isSleeping,
    signatureTiming: signature,
    signatureRun,
  }
}

// The build-time constant keeps hook order stable and drops DialKit from production.
const useTuning = import.meta.env.DEV_TOOLS ? useDialTuning : () => productionTuning

function Home() {
  const { settings, isSleeping, signatureTiming, signatureRun } = useTuning()

  return (
    <main className="relative isolate flex min-h-svh justify-center overflow-hidden px-6 pb-16">
      <AmbientLight settings={settings} />
      <TableOfContents sections={sections} />
      <div data-sunlit-anchor className="relative z-10 w-full max-w-[34rem]">
        <h1 className="sr-only">Imo Madjid</h1>

        {/* The opening screen fills the viewport with mobile toolbars shown, so it never resizes
            as they collapse, and grows where its content doesn't fit, as in landscape. */}
        <Section id="about" className="flex min-h-svh flex-col justify-center py-16">
          {/* The wand hangs from above the page to the bottom of this row, where a toggle sat. */}
          <div className="relative mb-10 flex animate-enter items-center justify-between gap-6">
            <ProfileAvatar isSleeping={isSleeping} />
            <BlindWand settings={settings} />
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
              , working on document drafting and consultation tools. Before that, I was a UX
              engineer at{' '}
              <LinkButton href="https://meeting.ai" logoSrc="/images/companies/meeting-ai.png">
                Meeting.ai
              </LinkButton>
              , where I designed and built experiences across web and mobile.
            </p>

            <p className="animate-enter [--enter-index:3]">
              I work across user research, design systems, and frontend engineering. I like working
              through interaction details in code, trying them out and refining how they feel. I
              also made{' '}
              <LinkButton
                href="https://lukis.imomadjid.com"
                logoSrc="/images/projects/lukis.svg"
                invertLogo
              >
                Lukis
              </LinkButton>
              , which turns an image into a painting right in the browser.
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

          <div className="mt-12 flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
            <Signature
              key={signatureRun}
              timing={signatureTiming}
              className="h-auto w-28 text-black transition-colors duration-300 [--enter-index:6] motion-reduce:animate-enter motion-reduce:transition-none dark:text-white"
            />
            <nav
              aria-label="Contact and social links"
              className="flex animate-enter flex-wrap gap-x-6 gap-y-2 text-sm [--enter-index:5]"
            >
              {[
                { label: 'Email', href: 'mailto:mhmmadjid@gmail.com' },
                { label: 'GitHub', href: 'https://github.com/imomadjid' },
                { label: 'LinkedIn', href: 'https://www.linkedin.com/in/imomadjid/' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className={cn('inline-flex min-h-11 items-center', textLinkClass)}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </Section>

        {import.meta.env.DEV_TOOLS && (
          <>
            <Section id="projects" className="mt-12">
              <ProjectList projects={projects} />
            </Section>
            {(['gallery', 'guestbook'] as const).map((id) => (
              <Section key={id} id={id} className="mt-12">
                <div className="flex h-[70svh] items-center justify-center rounded-3xl border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700">
                  {draftSections.find((entry) => entry.id === id)?.label}
                </div>
              </Section>
            ))}
          </>
        )}
      </div>
    </main>
  )
}
