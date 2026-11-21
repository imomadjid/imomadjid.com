/* Static liquid-glass surface layer, shared by Button's glass prop and LinkButton. Put it on an
   absolutely positioned child of a `group` element; --glass-fill and shadow-glass live in
   src/styles.css. The layer sits on the element's edge and pulls in 1px per side while
   pressed, the same shrink the FF button variants use. Hover and press tint it with
   bg-hover / bg-active under the fill gradient. Pair the transition list with durations:
   inset 180ms ease-out, color 80ms. */
const glassBase = 'inset-0 bg-(image:--glass-fill) shadow-glass transition-[inset,background-color]'

export const glassSurface = {
  rest: `${glassBase} group-hover:bg-hover group-active:bg-active group-active:inset-px`,
  // Held (active prop, open popup trigger): pressed tint at full size.
  held: `${glassBase} bg-active group-active:inset-px`,
  // Loading holds the rest look, as the variant fills do.
  loading: glassBase,
}
