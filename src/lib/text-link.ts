import { tw } from '#/lib/tw'

/* Underlined text link, shared by the homepage contact links and the 404 page. Neutral
   utilities rather than the --muted-foreground token: dark: follows the Sunlit scene, the token
   follows the instant theme class. */
export const textLinkClass = tw(
  'text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-50',
)
