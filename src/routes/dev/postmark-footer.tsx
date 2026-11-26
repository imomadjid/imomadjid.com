import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/postmark-footer')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Postmark footer · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/postmark-footer-fixture'), 'PostmarkFooterFixture')
    : () => null,
})
