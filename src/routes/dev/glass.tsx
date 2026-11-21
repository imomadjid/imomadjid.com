import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/glass')({
  head: import.meta.env.DEV ? () => ({ meta: [{ title: 'Glass · Dev playground' }] }) : undefined,
  component: import.meta.env.DEV
    ? lazyRouteComponent(() => import('#/dev/glass-fixture'), 'GlassFixture')
    : () => null,
})
