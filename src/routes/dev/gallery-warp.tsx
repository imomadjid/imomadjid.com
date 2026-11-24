import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/gallery-warp')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Gallery warp · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/gallery-warp-fixture'), 'GalleryWarpFixture')
    : () => null,
})
