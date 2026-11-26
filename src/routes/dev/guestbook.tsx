import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/guestbook')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Guestbook wall · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/guestbook-fixture'), 'GuestbookFixture')
    : () => null,
})
