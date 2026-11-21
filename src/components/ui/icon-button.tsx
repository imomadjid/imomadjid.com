import { Button as ButtonPrimitive } from '@base-ui/react/button'

import { cn } from '#/lib/utils'

// FF Base UI button's ghost/icon variant, scoped to this site's current needs.
// Source: https://www.fluidfunctionalism.com/r/base/button.json
type IconButtonProps = Omit<ButtonPrimitive.Props, 'className'> & { className?: string }

export function IconButton({ className, children, ...props }: IconButtonProps) {
  return (
    <ButtonPrimitive
      {...props}
      className={cn(
        'group relative isolate inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-neutral-600 transition-colors duration-80 outline-none hover:text-neutral-950 focus-visible:ring-1 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-50',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-px rounded-[inherit] bg-transparent shadow-[0_0_0_1px_transparent] transition-[box-shadow,background-color] duration-180 group-hover:bg-hover group-hover:shadow-[0_0_0_1px_var(--hover)] group-active:bg-active group-active:shadow-[0_0_0_0px_var(--active)]"
      />
      <span className="relative inline-flex items-center justify-center">{children}</span>
    </ButtonPrimitive>
  )
}
