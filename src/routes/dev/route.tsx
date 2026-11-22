import { createFileRoute, lazyRouteComponent, notFound } from '@tanstack/react-router'

import devCss from '#/dev/dev.css?url'

// Playground for the dev server and dev.imomadjid.com. The build-time DEV_TOOLS constant drops
// each dynamic import, so production bundles carry no playground code and every /dev URL falls
// through to the 404. The root route already marks every page noindex wherever this is on.
// dev.css links only under /dev, so site pages in dev render with production CSS alone and a
// missing `@source not` update shows up locally.
export const Route = createFileRoute('/dev')({
  beforeLoad: () => {
    if (!import.meta.env.DEV_TOOLS) throw notFound()
  },
  head: import.meta.env.DEV_TOOLS
    ? () => ({
        meta: [{ title: 'Dev playground' }],
        links: [{ rel: 'stylesheet', href: devCss }],
      })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/dev-layout'), 'DevLayout')
    : () => null,
})
