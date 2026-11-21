import { createFileRoute, lazyRouteComponent, notFound } from '@tanstack/react-router'

import devCss from '#/dev/dev.css?url'

// Local playground. The build-time DEV constant drops each dynamic import, so production
// bundles carry no playground code and every /dev URL falls through to the 404.
// dev.css links only under /dev, so site pages in dev render with production CSS alone and a
// missing `@source not` update shows up locally.
export const Route = createFileRoute('/dev')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  head: import.meta.env.DEV
    ? () => ({
        meta: [{ title: 'Dev playground' }, { name: 'robots', content: 'noindex' }],
        links: [{ rel: 'stylesheet', href: devCss }],
      })
    : undefined,
  component: import.meta.env.DEV
    ? lazyRouteComponent(() => import('#/dev/dev-layout'), 'DevLayout')
    : () => null,
})
