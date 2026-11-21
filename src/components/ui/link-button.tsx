import type { ReactNode } from 'react'

import { glassSurface } from '#/lib/glass'
import { cn } from '#/lib/utils'

// Compact (28px) static-glass pill inside running text. An inline-block, not inline-flex, so its
// baseline is the label's and the name sits on the sentence's baseline; a flex box would take
// the logo's bottom edge instead. h-7 pins the height; the inline logo would add half a pixel.
export function LinkButton({
  href,
  logoSrc,
  invertLogo = false,
  children,
}: {
  href: string
  logoSrc: string
  invertLogo?: boolean
  children: ReactNode
}) {
  return (
    <a
      href={href}
      className="group relative isolate inline-block h-7 rounded-full px-2.5 py-1.5 leading-none whitespace-nowrap text-neutral-800 transition-colors duration-180 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none dark:text-neutral-200 dark:hover:text-neutral-50"
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute -z-10 rounded-[inherit] [transition-duration:180ms,80ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease] group-active:[transition-duration:80ms,80ms] motion-reduce:transition-none',
          glassSurface.rest,
        )}
      />
      {/* A 1em logo at -0.125em centers on the cap height, the usual inline-icon offset. */}
      <img
        src={logoSrc}
        alt=""
        width={16}
        height={16}
        className={cn(
          'mr-1.5 inline-block size-4 object-contain align-[-0.125em]',
          invertLogo &&
            'transition-[filter] duration-300 motion-reduce:transition-none dark:invert',
        )}
      />
      {children}
    </a>
  )
}
