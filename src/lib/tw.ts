/**
 * Marks a string as Tailwind classes, so the formatter sorts it (`tw` is listed in the
 * `sortTailwindcss` functions in vite.config.ts) as it sorts `className` and `cn(...)`. Use it for
 * class strings kept in constants; it returns the string unchanged.
 */
export function tw(classes: string) {
  return classes
}
