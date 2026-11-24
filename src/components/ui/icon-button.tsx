import { Button as ButtonPrimitive } from '@base-ui/react/button'

import { glassSurface } from '#/lib/glass'
import { cn } from '#/lib/utils'

// FF's control ladder stops at 36px (default); 2xl is this site's own step past it, for a
// control that floats on its own, such as the Gallery overlay's close button.
const sizeClasses = {
  default: 'size-9',
  '2xl': 'size-12',
} as const

type IconButtonSize = keyof typeof sizeClasses

// FF Base UI button's ghost/icon variant, scoped to this site's current needs.
// Source: https://www.fluidfunctionalism.com/r/base/button.json
type IconButtonProps = Omit<ButtonPrimitive.Props, 'className'> & {
  className?: string
  size?: IconButtonSize
  /** Static liquid glass (#/lib/glass) in place of the ghost fill. */
  glass?: boolean
}

export function IconButton({
  className,
  size = 'default',
  glass = false,
  children,
  ...props
}: IconButtonProps) {
  return (
    <ButtonPrimitive
      {...props}
      className={cn(
        'group relative isolate inline-flex cursor-pointer items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-1 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50',
        sizeClasses[size],
        glass
          ? 'text-neutral-800 duration-180 hover:text-neutral-950 dark:text-neutral-200 dark:hover:text-neutral-50'
          : 'text-neutral-600 duration-80 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute rounded-[inherit]',
          glass
            ? cn('-z-10 motion-reduce:transition-none', glassSurface.rest)
            : 'inset-px bg-transparent shadow-[0_0_0_1px_transparent] transition-[box-shadow,background-color] duration-180 group-hover:bg-hover group-hover:shadow-[0_0_0_1px_var(--hover)] group-active:bg-active group-active:shadow-[0_0_0_0px_var(--active)]',
        )}
      />
      <span className="relative inline-flex items-center justify-center">{children}</span>
    </ButtonPrimitive>
  )
}
