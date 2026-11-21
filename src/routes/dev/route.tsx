import { createFileRoute, lazyRouteComponent, notFound } from '@tanstack/react-router'

// Local playground. The build-time DEV constant drops each dynamic import, so production
// bundles carry no playground code and every /dev URL falls through to the 404.
export const Route = createFileRoute('/dev')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  head: import.meta.env.DEV
    ? () => ({ meta: [{ title: 'Dev playground' }, { name: 'robots', content: 'noindex' }] })
    : undefined,
  component: import.meta.env.DEV
    ? lazyRouteComponent(() => import('#/dev/dev-layout'), 'DevLayout')
    : () => null,
})
