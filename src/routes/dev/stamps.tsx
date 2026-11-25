import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/stamps')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Stamps · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/stamps-fixture'), 'StampsFixture')
    : () => null,
})
