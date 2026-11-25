import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/live-glass')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Live glass · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/live-glass-fixture'), 'LiveGlassFixture')
    : () => null,
})
