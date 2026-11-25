import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/postmarks')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Postmarks · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/postmarks-fixture'), 'PostmarksFixture')
    : () => null,
})
