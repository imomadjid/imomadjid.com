import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/')({
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/dev-overview'), 'DevOverview')
    : () => null,
})
