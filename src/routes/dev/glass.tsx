import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/glass')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Glass · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/glass-fixture'), 'GlassFixture')
    : () => null,
})
