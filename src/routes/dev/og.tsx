import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/og')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Social card · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/og-fixture'), 'OgFixture')
    : () => null,
})
