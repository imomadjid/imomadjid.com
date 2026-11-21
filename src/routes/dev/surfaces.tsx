import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/surfaces')({
  head: import.meta.env.DEV
    ? () => ({ meta: [{ title: 'Surfaces · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV
    ? lazyRouteComponent(() => import('#/dev/surfaces-fixture'), 'SurfacesFixture')
    : () => null,
})
