import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useSyncExternalStore } from 'react'
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
import { defaultAmbientSettings } from '#/lib/ambient-settings'
import { recedeClass } from '#/lib/page-recede'
import { PostmarkStamp } from '#/lib/postmark-client'
import { projectFile, projectVideo } from '#/lib/project-media'
import { signatureTiming } from '#/lib/signature-settings'
import { textLinkClass } from '#/lib/text-link'
import { cn } from '#/lib/utils'

const siteUrl = 'https://imomadjid.com/'
const title = 'Imo Madjid'
const description = 'Software engineer at DocDraft, based in Jakarta.'
const ogImage = {
  url: `${siteUrl}og.jpg`,
  alt: 'The imo logo on a wall in dappled sunlight, through blinds and leaves',
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
      jobTitle: 'Software engineer',
      worksFor: { '@type': 'Organization', name: 'DocDraft', url: 'https://docdraft.ai' },
      homeLocation: { '@type': 'Place', name: 'Jakarta, Indonesia' },
      sameAs: ['https://github.com/imomadjid', 'https://www.linkedin.com/in/imomadjid/'],
    },
  ],
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: siteUrl },
      { property: 'og:site_name', content: 'Imo Madjid' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage.url },
      { property: 'og:image:type', content: 'image/jpeg' },
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
    // The README's cover, light and dark.
    preview: {
      kind: 'image',
      light: projectFile('antijank/light.svg'),
      dark: projectFile('antijank/dark.svg'),
      className: 'bg-white dark:bg-[#0d1117]',
    },
  },
  {
    name: 'Krillion Bench',
    description: 'A general knowledge benchmark for LLMs on Krillion.io.',
    year: 2026,
    href: 'https://krillion-bench.vercel.app',
    // The live results site: score chart, tooltips, all configurations, a model search. It has
    // no dark mode.
    preview: {
      kind: 'video',
      light: projectVideo('krillion-bench', 'light'),
    },
  },
  {
    name: 'Book n Quill',
    description: 'A playful notepad with a Minecraft Java Book and Quill interface.',
    year: 2026,
    href: 'https://book-n-quill.mhmmadjid.workers.dev',
    // Writes a packing list, turns the page, and signs it. The app has no dark mode.
    preview: {
      kind: 'video',
      light: projectVideo('book-n-quill', 'light'),
    },
  },
  {
    name: 'Lukis',
    description: 'A local-first painterly image editor, built with Astro and WebGPU.',
    year: 2026,
    href: 'https://lukis.imomadjid.com',
    // Drags a photo in, paints it, moves Paint and Brush, then presses Restart, which returns to
    // the first frame so the loop is seamless. Captured frame by frame at 60 fps. The photo is
    // "Manarola, Italy" by Linh Nguyen, CC0
    // (commons.wikimedia.org/wiki/File:Manarola,_Italy_(Unsplash_DNE9iZ1Kqzk).jpg).
    preview: {
      kind: 'video',
      light: projectVideo('lukis', 'light'),
      dark: projectVideo('lukis', 'dark'),
    },
  },
  {
    name: 'Influencer Tracker',
    description:
      'Scores finfluencers’ stock calls on Instagram and X against real forward prices, versus SPY.',
    year: 2026,
    href: 'https://influencer-tracker-beta.vercel.app',
    // Leaderboard, the top creator's scorecard, then one of their tickers against SPY.
    preview: {
      kind: 'video',
      light: projectVideo('influencer-tracker', 'light'),
      dark: projectVideo('influencer-tracker', 'dark'),
    },
  },
  {
    name: 'Binsight',
    description: 'An iPhone app that uses vision machine learning to help sort trash.',
    year: 2025,
    href: 'https://github.com/imomadjid/Binsight',
    // The four app screenshots from the README.
    preview: { kind: 'image', light: projectFile('binsight/screens.webp') },
  },
  {
    name: 'Name a Woman',
    description:
      'A 60-second game: name as many women as you can, and each one joins a tally everyone shares.',
    year: 2024,
    href: 'https://name-a-woman.pages.dev',
    // Five names, each card's portrait forming from dots. Played back 1.4x, since the recorder
    // rendered the dots below 60 fps.
    preview: {
      kind: 'video',
      light: projectVideo('name-a-woman', 'light'),
      dark: projectVideo('name-a-woman', 'dark'),
    },
  },
] as const satisfies readonly Project[]

// Lazy, so the first load carries neither its code nor its photos.
const GallerySection = lazy(() => import('#/components/gallery'))

// The postmark footer, a pile of visitors' postmarks at the foot of the page. Lazy, as the
// Gallery is; the visitor's stamp doesn't wait for it (PostmarkStamp).
const PostmarkFooter = lazy(() =>
  import('#/dev/postmark-footer').then(({ PostmarkFooter }) => ({
    default: PostmarkFooter,
  })),
)

// One list names the page's sections for both their headings and the table of contents.
const sections = [
  { id: 'about', label: 'About', mark: Logo },
  { id: 'projects', label: 'Random bullshit' },
  { id: 'gallery', label: 'Gallery' },
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

const noChanges = () => () => {}

// Sleep Focus, with the dev tools only: `?sleep` puts the avatar to sleep. The build-time
// constant keeps hook order stable and leaves it out of production.
const useSleepFocus = import.meta.env.DEV_TOOLS
  ? () =>
      useSyncExternalStore(
        noChanges,
        () => new URLSearchParams(location.search).has('sleep'),
        () => false,
      )
  : () => false

function Home() {
  const isSleeping = useSleepFocus()

  return (
    <main className="relative isolate flex min-h-svh justify-center overflow-x-clip px-6 pb-16">
      <AmbientLight settings={defaultAmbientSettings} />
      <TableOfContents sections={sections} />
      {/* Stamps the visitor on their first action, wherever on the page they are. */}
      <PostmarkStamp />
      {/* No z-index here: a stacking context would hold the wand under the light layer. */}
      <div data-sunlit-anchor className="relative w-full max-w-[34rem]">
        <h1 className="sr-only">Imo Madjid</h1>

        {/* The opening screen fills the viewport with mobile toolbars shown, so it never resizes
            as they collapse, and grows where its content doesn't fit, as in landscape. */}
        <Section id="about" className="flex min-h-svh flex-col justify-center py-16">
          {/* The wand hangs from above the page to the bottom of this row, where a toggle sat. */}
          <div className="relative mb-10 flex animate-enter items-center justify-between gap-6">
            <ProfileAvatar isSleeping={isSleeping} />
            <BlindWand settings={defaultAmbientSettings} />
          </div>

          <div className="space-y-8 text-base leading-[1.8] text-neutral-600 transition-colors duration-300 motion-reduce:transition-none dark:text-neutral-400">
            {/* Cut for now, kept to revisit. It ended the first sentence: “…worthy of being called
                a design engineer, though honestly, I’m still in the shadows of some inspiring giants
                in this field.” */}
            <p className="animate-enter text-neutral-900 transition-colors duration-300 [--enter-index:1] motion-reduce:transition-none dark:text-neutral-100">
              Hey, I’m Imo. I’m a software engineer based in Jakarta, but in the fast-paced, messy
              world of tech we’re in, I like to think my love for design, engineering, and product
              makes me worthy of being called a design engineer.
            </p>

            <p className="animate-enter [--enter-index:2]">
              I’m a software engineer at{' '}
              <LinkButton href="https://docdraft.ai" logoSrc="/images/companies/docdraft.svg">
                DocDraft
              </LinkButton>
              , building experiences that help Americans through high-stress, anxious legal
              situations. Before that, I was a UX engineer at{' '}
              <LinkButton href="https://meeting.ai" logoSrc="/images/companies/meeting-ai.png">
                Meeting.ai
              </LinkButton>
              , where I designed and built apps across web and mobile that use AI before, during,
              and after meetings.
            </p>

            <p className="animate-enter [--enter-index:3]">
              I was lucky enough to get selected for the{' '}
              <LinkButton
                href="https://developer.apple.com/academies/"
                logoSrc="/images/companies/apple.svg"
                invertLogo
              >
                Apple Developer Academy
              </LinkButton>
              , where I learned to build native experiences for the Apple ecosystem alongside
              world-class developers and mentors, in an environment even Steve Jobs would love.
            </p>

            <p className="animate-enter [--enter-index:4]">
              I want you to guess my taste in design and engineering from just playing around with
              this site. I’m the type of guy who cares less about what I’m building and more{' '}
              <em>how</em> to make it leave a lasting impression, something that inspires people and
              genuinely makes them say “wow.”
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
            <Signature
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

        {/* Shrinks behind an open Gallery dialog (src/lib/page-recede.ts). About stays out: it
            holds the wand, and scaling forms a stacking context that would hold the wand under
            the light layer. While a dialog is open About is far above the screen anyway. */}
        <div data-recede className={recedeClass}>
          {/* Sections sit 8rem apart; About's bottom padding supplies half of the first gap. */}
          <Section id="projects" className="mt-16">
            <ProjectList projects={projects} />
          </Section>

          <Section id="gallery" className="mt-32">
            <Suspense>
              <GallerySection />
            </Suspense>
          </Section>

          {/* The page ends at the postmark footer's foot. */}
          <Suspense fallback={<div className="h-32" />}>
            <PostmarkFooter />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
