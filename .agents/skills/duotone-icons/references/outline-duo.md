# Outline duo

The stroked sibling of fill duo. Every line is a solid 1.5 stroke, and only the interior of the
main shape is tinted. Use it only when the user asks for outlined duotone icons, and don't mix
it with fill duo in one set.

| Property | Value |
| --- | --- |
| Canvas | `viewBox="0 0 18 18"` |
| Stroke | 1.5, `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"` |
| Main shape inset | Stroke centerline at 1.75 and 16.25, so the outer edge lands at 1 |
| Small accents | Rays and ticks may reach 0.75 |
| Rect corners | 1.5 to 2 at the centerline |
| Tint | The same main shape, `fill="currentColor" fill-opacity="0.3"`, under the stroke |

## Tone rules

- Tint only the main closed shape, and only where a stroke bounds it. The tint never spills
  past an edge.
- Small closed accents, such as dots, stay solid primary rather than tinted.
- Open shapes, such as lines and arcs, get no tint.
- Draw the tint first and the stroke after, with the same geometry.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"
  aria-hidden="true">
  <circle cx="9" cy="9" r="3.75" fill="currentColor" fill-opacity="0.3" data-color="color-2" />
  <circle cx="9" cy="9" r="3.75" fill="none" stroke="currentColor" stroke-width="1.5" />
  <path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
    d="M9 1.75V2.75M16.25 9H15.25M9 16.25V15.25M1.75 9H2.75M14.127 3.873L13.419 4.581M14.127 14.127L13.419 13.419M3.873 14.127L4.581 13.419M3.873 3.873L4.581 4.581" />
</svg>
```

The lint script is written for fill duo and warns on every stroke. Run it with `--outline`
to lint this variant instead: it expects strokes of 1.5 and a 0.3 tint.
