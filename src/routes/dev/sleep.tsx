import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/sleep')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Sleep · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/sleep-fixture'), 'SleepFixture')
    : () => null,
})
