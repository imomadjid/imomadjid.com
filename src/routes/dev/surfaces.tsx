import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/surfaces')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Surfaces · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/surfaces-fixture'), 'SurfacesFixture')
    : () => null,
})
