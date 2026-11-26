import { useSyncExternalStore } from 'react'

import { getSoundOn, setSoundOn, subscribeSound } from '#/lib/sound'
import { cn } from '#/lib/utils'

/** The page's footer: a quiet row at the end of the column, holding the Sound switch. */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('mt-32 flex justify-end text-sm', className)}>
      <SoundSwitch />
    </footer>
  )
}

/**
 * Sound on or off for the site's cues, remembered on this device. On until the visitor turns it
 * off, as cuelume starts. Neutral utilities, as the text links use: dark: follows the Sunlit scene.
 */
function SoundSwitch() {
  // The prerendered page can't know the choice, so the word follows `data-sound`, which the head
  // script sets before the page paints; the state only drives what the switch announces.
  const on = useSyncExternalStore(subscribeSound, getSoundOn, () => true)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => void setSoundOn(!on)}
      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 dark:hover:text-neutral-50"
    >
      Sound
      {/* The switch's state is announced through aria-checked; the word is for the eye. */}
      <span aria-hidden="true" className="text-neutral-900 dark:text-neutral-100">
        <span className="in-data-[sound=off]:hidden">On</span>
        <span className="not-in-data-[sound=off]:hidden">Off</span>
      </span>
    </button>
  )
}
