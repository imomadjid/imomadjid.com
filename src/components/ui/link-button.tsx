import type { ReactNode } from 'react'

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
      data-theme-color
      href={href}
      className="inline-flex h-7 items-center justify-center gap-1.5 rounded-full px-2.5 align-middle leading-none text-neutral-800 shadow-surface-1 transition-colors duration-180 hover:bg-hover hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:bg-active motion-reduce:transition-none dark:text-neutral-200 dark:hover:text-neutral-50"
    >
      <img
        src={logoSrc}
        alt=""
        width={16}
        height={16}
        className={
          invertLogo
            ? 'size-4 shrink-0 object-contain dark:invert'
            : 'size-4 shrink-0 object-contain'
        }
      />
      <span>{children}</span>
    </a>
  )
}
