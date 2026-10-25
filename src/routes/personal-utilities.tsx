import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/personal-utilities')({
  head: () => ({
    meta: [
      { title: 'Personal Utilities · Imo Madjid' },
      { name: 'robots', content: 'noindex, nofollow' },
      {
        name: 'description',
        content: 'Information about the private Google account tools operated by Imo Madjid.',
      },
    ],
  }),
  component: UtilitiesLayout,
})

function UtilitiesLayout() {
  return (
    <main className="mx-auto max-w-[70ch] px-6 py-16 text-base leading-relaxed text-neutral-600 sm:py-24 dark:text-neutral-400">
      <header className="mb-12 text-sm text-neutral-500 dark:text-neutral-400">
        Imo Madjid / Personal Utilities
      </header>
      <article className="space-y-8 text-pretty [&_a]:break-words [&_a]:underline [&_a]:decoration-neutral-300 [&_a]:underline-offset-4 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:hover]:text-neutral-950 dark:[&_a:hover]:text-neutral-50 [&_h1]:text-3xl [&_h1]:leading-tight [&_h1]:font-medium [&_h1]:tracking-tight [&_h1]:text-neutral-950 dark:[&_h1]:text-neutral-50 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:leading-snug [&_h2]:font-medium [&_h2]:text-neutral-950 dark:[&_h2]:text-neutral-50 [&_section]:space-y-3">
        <Outlet />
      </article>
    </main>
  )
}
