import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/story')({
  head: import.meta.env.DEV_TOOLS
    ? () => ({ meta: [{ title: 'Story · Dev playground' }] })
    : undefined,
  component: import.meta.env.DEV_TOOLS
    ? lazyRouteComponent(() => import('#/dev/story-fixture'), 'StoryFixture')
    : () => null,
})
