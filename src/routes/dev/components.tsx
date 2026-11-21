import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/components')({
  head: import.meta.env.DEV
    ? () => ({ meta: [{ title: 'Components · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV
    ? lazyRouteComponent(() => import('#/dev/components-fixture'), 'ComponentsFixture')
    : () => null,
})
