/* Static liquid-glass surface layer, shared by Button's glass prop and LinkButton. Put it on an
   absolutely positioned child of a `group` element; the layer stack lives in the glass-surface
   utility (src/theme.css) and its tokens in src/styles.css. The layer sits on the element's
   edge and pulls in 1px per side while pressed, the same shrink the FF button variants use.
   Hover and press tint it with bg-hover / bg-active under the fill gradient; on tinted glass,
   where an opaque tint would hide that, --glass-press draws the same overlay on top. The
   durations pair with the transition list by position: inset 180ms ease-out, colors 80ms. */
const glassBase =
  'inset-0 glass-surface shadow-glass transition-[inset,background-color,--glass-press] [transition-duration:180ms,80ms,80ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease,ease] group-active:[transition-duration:80ms,80ms,80ms]'

export const glassSurface = {
  rest: `${glassBase} group-hover:bg-hover group-hover:[--glass-press:var(--hover)] group-active:bg-active group-active:[--glass-press:var(--active)] group-active:inset-px`,
  // Held (active prop, open popup trigger): pressed tint at full size.
  held: `${glassBase} bg-active [--glass-press:var(--active)] group-active:inset-px`,
  // Loading holds the rest look, as the variant fills do.
  loading: glassBase,
}
