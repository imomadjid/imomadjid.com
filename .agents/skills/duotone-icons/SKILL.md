---
name: duotone-icons
description: Draws and reviews 18px two-tone "fill duo" SVG icons, where a filled body sits at 40% opacity and solid details sit on top in the same color. Gives the exact grid, padding, line weight, corner radii and tone rules, how to convert an outline icon into this style, a React and SVG output format on currentColor, and scripts that lint and preview the result. Use it whenever the user asks for duotone, two-tone, fill duo, glyph duo or tinted icons, wants a custom icon that matches a duotone set, wants an outline icon converted to duotone, or asks for icons for a toggle, nav or button in that style, even if they don't say "duotone".
---

# Fill duo icons

A fill duo icon is one color in two tones. The **body**, the icon's main silhouette, is filled at
40% opacity. The **details**, such as lines, dots, flaps, stands and rays, are filled solid on
top. Nothing is stroked in the finished icon. A line is a filled capsule 1.5 units wide.

The style reads as a glyph with depth. It works because the body's silhouette carries the
recognition at small sizes, and the solid parts point the eye to what makes the icon distinct.

`<skill-dir>` below is this skill's folder, where this file is.

## The grid

| Property | Value |
| --- | --- |
| Canvas | `viewBox="0 0 18 18"`, rendered at 18px; 36px is the 2x size |
| Body bounds | Edges at 1 and 17, 1 unit of padding on each side |
| Overshoot | Wide flat parts (a laptop base) may run 0 to 18; small accents may reach 0.5 |
| Line weight | 1.5, with 0.75 round ends, drawn as a filled capsule |
| Large rect corners | 2.75 (a full-width card, screen or envelope) |
| Narrow rect corners | 2.25 when the rect is about 10 wide; 0.75 for small inner details |
| Dots | Radius 1 for a status dot, 0.75 for a small one, 1.25 for a sun or avatar dot |
| Secondary tone | `fill-opacity="0.4"`; a rare third tone uses 0.2 |
| Gaps | 1 between a body and a separate solid part (sun rays); 1.5 between two bodies |
| Coordinates | Snap to 0.25; at most 3 decimals |

Keep a symmetric icon centered on 9. A shape that is not symmetric, such as a crescent or a
play triangle, centers by eye, not by its bounding box.

## Which part gets which tone

Decide this before drawing a path. It is the part of the style that is easiest to get wrong.

1. **The body is secondary.** The largest closed shape is the body: a screen, a card, an
   envelope, a bell, a tower. Fill it at 0.4.
2. **Details on the body are primary.** Lines, dots, buttons and slots sit on the body,
   solid, drawn after it. Primary on top of secondary looks clean because primary is opaque.
3. **A region that touches the body's edge is clipped to it.** An envelope flap, a folder tab,
   an image's mountain or a door is the body's own region painted solid, so its outer edge
   follows the body's outline and its corners use the body's radius.
4. **Separate pieces outside the body are primary.** A stand, a ray, a handle, a clapper, a
   lid or a small companion shape is solid when it reads as its own physical part.
   A rim, lip, flare or foot that is part of the body's outline is not a separate piece: a
   bell's flared lip, a mug's base or a cloud's bumps stay in the secondary body. Ask whether
   the part would come away if you picked the object up; only parts that would are solid.
5. **An icon made of one shape is entirely secondary.** A star, heart, cloud or moon has no
   detail to make solid, so the whole icon is 0.4. It reads lighter than the rest of the set,
   and that is expected; don't invent a detail to darken it.
6. **Two-part split icons alternate.** A half-and-half icon, such as a light and dark
   indicator, takes one tone per half and swaps tones between the outer ring and the inner disc.
7. **Never overlap two secondary shapes.** Their opacities stack into a darker band. Merge
   them into one path, or leave a gap.

Draw only the details that identify the object. The style is sparse: a trash can is a can and
a lid with no slots, and a bell is a dome and a clapper. A detail the silhouette already
explains adds noise at 18px.

Solid parts should be the minority. When most of the icon is solid, it reads as a filled
icon, not a duo one. Make the body bigger or move details onto it.

## Converting an outline icon

Most fill duo icons start as a 1.5-stroke outline icon on the same 18 grid. Its stroke
centerline sits 1.75 in from the edge, so its outer edge is at 1. Grow every shape by half
the stroke:

- A circle's radius gains 0.75 (outline `r=3.75` becomes `r=4.5`).
- A rect's edges move out by 0.75 and its corner radius gains 0.75 (2 becomes 2.75).
- A concave arc, such as the inside of a crescent, loses 0.75 from its radius.
- A sharp tip becomes a 0.75 round end.
- An open line, such as a ray or a stand, becomes a capsule 1.5 wide with the same endpoints.

Then apply the tone rules. The outline's closed main shape becomes the body, and its open
lines become solid details.

## Writing the SVG

Write every color as `currentColor` so the icon takes its color from text, and its hover,
active and disabled states from CSS. Mark the secondary layer with `data-color="color-2"`,
which lets a design tool or CSS recolor it separately.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"
  fill="currentColor" aria-hidden="true">
  <!-- Body: screen, outer edge at 1.25 to 16.75, radius 2.75 -->
  <path data-color="color-2" fill-opacity="0.4"
    d="M4 2H14C15.519 2 16.75 3.231 16.75 4.75V10.25C16.75 11.769 15.519 13 14 13H4C2.481 13 1.25 11.769 1.25 10.25V4.75C1.25 3.231 2.481 2 4 2Z" />
  <!-- Detail: neck and base as one solid path -->
  <path d="M8.25 13H9.75V14.5H12.25C12.664 14.5 13 14.836 13 15.25C13 15.664 12.664 16 12.25 16H5.75C5.336 16 5 15.664 5 15.25C5 14.836 5.336 14.5 5.75 14.5H8.25V13Z" />
</svg>
```

Order the elements body first, then details, so solid parts paint over the body.

Keep the body whole under the solid parts; don't cut it where a flap or tab begins. A solid
part fully covers what's beneath it, while two shapes that only touch leave a faint seam on
the shared edge at 18px. In the preview's red column, a hairline of red around a solid part
is that overlap showing through the anti-aliased edge, and it's expected.

Worked examples are in `<skill-dir>/examples/`: a monitor (body plus solid stand), a sun (body
plus solid rays), a moon (one shape, all secondary) and the same moon drawn with the stroke
shortcut below. Read one before drawing your first icon in a session.

### In React

Keep one shared wrapper, so every icon in the set has the same canvas and props.

```tsx
import type { ReactNode, SVGProps } from 'react'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>
const secondary = { fill: 'currentColor', fillOpacity: 0.4, 'data-color': 'color-2' } as const

function Icon(props: IconProps & { children: ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width={18} height={18}
      fill="currentColor" aria-hidden="true" {...props} />
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="9" r="4.5" {...secondary} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path key={angle} transform={`rotate(${angle} 9 9)`}
          d="M9 1C9.414 1 9.75 1.336 9.75 1.75V2.75C9.75 3.164 9.414 3.5 9 3.5C8.586 3.5 8.25 3.164 8.25 2.75V1.75C8.25 1.336 8.586 1 9 1Z" />
      ))}
    </Icon>
  )
}
```

An icon that labels a control gets its accessible name from the control, so it stays
`aria-hidden`.

### Authoring shortcut: stroke inside an opacity group

Expanding curves by 0.75 by hand is slow. A faster way that renders the same is to draw the
outline geometry with a 1.5 round stroke plus a fill, and wrap the body in a group with
`opacity="0.4"`. Group opacity composites the group once, so the fill and the stroke don't
stack.

```svg
<g opacity="0.4" data-color="color-2">
  <circle cx="9" cy="9" r="3.75" fill="currentColor" stroke="currentColor"
    stroke-width="1.5" stroke-linejoin="round" />
</g>
<path d="M9 1.75V2.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
```

Use it while iterating, or in an app where only the rendered result matters. Expand the
strokes before the icons ship in a library, a Figma file or an icon font, because those
recolor through `fill` and treat a stroke as a separate color. The lint script reports
strokes, so it tells you which icons still need expanding.

## Check the result

Run the lint script on the exported SVG files. It needs only Node.

```bash
node <skill-dir>/scripts/lint.mjs icons/*.svg
```

It fails on the wrong canvas, hard-coded colors, a missing secondary layer, or a shape
outside the canvas. It warns on strokes, secondary opacities other than 0.4 or 0.2, overlapping
secondary layers it can detect, a body that doesn't reach the 1 to 17 bounds, and
coordinates with more than 3 decimals.

Then look at it. Lint can't judge whether an icon reads well.

```bash
node <skill-dir>/scripts/preview.mjs icons/*.svg --out icon-preview.html
```

The page shows each icon at 18px on light and dark, at 36px, and at 72px on the grid with the
1-unit padding marked. It also shows a column with the secondary layer in red, where a tone
mistake is obvious. Open it in a browser and check:

- At 18px, the silhouette alone says what the icon is.
- Every icon in the set has a similar visual weight. A body that looks heavy shrinks by
  0.25 to 0.5. A single-shape icon reads lighter, which is fine.
- In the red column, red covers only bodies, never a line, dot or separate piece. A red
  hairline around the edge of a solid part is anti-aliasing, not a mistake.
- Nothing has a gap thinner than 1 unit, which closes up at 18px.

## Outline duo

If the user wants the stroked variant, the outline is solid and only the body's interior is
tinted. Its measurements are in [references/outline-duo.md](references/outline-duo.md). Don't
mix the two variants in one set.

## Credit

The measurements and tone rules come from studying the Fill Duo style of
[Nucleo](https://nucleoapp.com)'s UI icons. This skill contains none of Nucleo's artwork; the
examples are original. If a set needs breadth rather than a few custom icons, buy Nucleo's.
