# Beyond Sunlit: a room suggested by light

10 September 2026. Designer-team synthesis. The recommended glass-caustic crescent and depth-separated penumbra are now implemented locally. Remaining studies are proposals.

Implementation: projected-coordinate softness with separate blind/foliage caster offsets uses the existing 12 aperture samples. An analytic, incomplete double crescent with slow independent deformation occupies the lower-right margin. It uses spare channels in the existing light target, so there are no new render passes or texture assets. Its source strength is bounded by the direct-light field and it fades to zero at night. The highlight and dim shoulder composite in linear light over the neutral surface. DialKit exposes foliage depth and caustic amount/spread/drift; Reset Sunlit covers them. This is an art-directed caustic approximation, not a physical refractor simulation.

## Implemented before this research

The homepage now transitions the whole window projection between sun and moon: angle, stretch, slant, and convergence change together around a fixed upper-right origin. Blinds and foliage share that mapping. The main surface token and material stay stationary. Code checks, build, and native shader validation pass. Desktop day/night and narrow dark renders were inspected; a full recorded motion audit remains outstanding.

## Recommended next direction

Keep one quiet room, with an unseen window, plant, and drinking glass. Add one small, incomplete caustic crescent at the right margin. First refine the shadow depth that gives it context. The page should suggest more of the surrounding room without showing literal objects or replacing the neutral background.

**Caustics** are concentrated patterns of light produced by reflection or refraction. A designed approximation can give this page the visual cue without simulating an entire water surface or glass object.

The three designers agree that a localized caustic is the strongest extension beyond Sunlit. They differ on preparation: one recommends shallow material relief first, another projection-attached shadow softness. Prefer the latter first because the new sun/moon geometry makes a fixed screen-space softness gradient less convincing. Material relief is the next small material study, not another moving layer.

## Ranked studies

| Study                        | What the viewer sees                                                                                  | Motion                                                                             | Implementation direction                                                                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Glass caustic             | An incomplete, asymmetric crescent at the right edge, with a faint dark shoulder so it reads on white | Almost still; stretches with the light source, with very slow internal deformation | Start with analytic curved distance bands in the existing light pass. No extra pass. This approximates an authored optical pattern, not arbitrary glass.                             |
| 2. Depth-aware penumbra      | Window edges remain more defined than distant foliage                                                 | Softness follows projected coordinates through sun/moon changes                    | Different caster-distance offsets for blinds and foliage, retaining the fixed sample budget.                                                                                         |
| 3. Matte microrelief         | Fine paper/plaster texture catches shallow light                                                      | Material remains fixed; only its lighting changes                                  | One normal lookup or a smooth height-field gradient in the material pass. Avoid sparkling high-frequency noise.                                                                      |
| 4. Passing cloud             | Direct sunlight recedes and shadows soften briefly                                                    | Slow irregular events separated by quiet holds                                     | Couple directional intensity and softness with one low-frequency envelope. Do not modulate the base surface color.                                                                   |
| 5. Old window glass          | Slightly uneven projected light and shadow edges                                                      | Glass distortion stays fixed in window space                                       | Small low-frequency coordinate warp before shadow evaluation. Avoid swimming distortion.                                                                                             |
| 6. Water-reflected corner    | Broad, broken luminous folds confined to an edge                                                      | Folds compress and reform rather than scroll sideways                              | A two-sample authored caustic texture is a modest first study. A physically generated caustic needs a larger rendering pipeline. Treat this as an alternative to the glass crescent. |
| 7. Grazing-angle prism trace | A tiny low-chroma spectral edge during a transition                                                   | Appears only at the appropriate source angle                                       | Offset an analytic edge by color, not the full shadow pass or HTML. Highest risk of looking like a digital glitch.                                                                   |

All cost statements are relative implementation estimates. None of these new studies has been GPU-profiled. Moonlight should suppress caustics strongly. Do not dim or recolor the whole surface to make a highlight visible.

## Primary inspiration and demos

- [Maxime Heckel: Caustics in WebGL](https://blog.maximeheckel.com/posts/caustics-in-webgl/) — refracted light concentration and render-target techniques. [Current WebGPU demo](https://r3f.maximeheckel.com/webgpu/caustics).
- [Maxime Heckel: Refraction, dispersion, and other shader light effects](https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/) — glass and restrained spectral edge ideas. [Refraction demo](https://r3f.maximeheckel.com/refraction).
- [Codrops: Inside HAOQI.DESIGN](https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/) — DOM and canvas coordination, constrained rim lighting. Borrow the bounded placement, not the full retro-futurist art direction. [Site](https://haoqi.design/).
- [Codrops: Relighting Images with Depth Maps and Three.js](https://tympanus.net/codrops/2026/08/19/relighting-images-with-depth-maps-and-three-js/) — normals and material detail reacting to light. [Demo](https://tympanus.net/Tutorials/RelightingImages/).
- [Codrops: Volatile Nexus](https://tympanus.net/codrops/2026/08/31/volatile-nexus-tinkering-with-glass-caustics-cubes-and-sound-in-three-js/) — coordinated glass and caustic motion. [Demo](https://dasprinzip.com/tinker/day42/).
- [Codrops: The Sleepers](https://tympanus.net/codrops/2026/07/10/the-sleepers-creating-an-atmospheric-webgl-experience-with-lightweight-techniques/) — inexpensive atmospheric motion. [Demo](https://projects.thibautfoussard.com/the-sleepers/).
- [Bartosz Ciechanowski: Lights and Shadows](https://ciechanow.ski/lights-and-shadows/) — interactive source-size, occlusion, penumbra, and matte-surface explanation.
- [Alexander Ameye: Rendering realtime caustics](https://ameye.dev/notes/realtime-caustics/) — controllable texture approximation with projection and masks.
- [Evan Wallace: WebGL Water](https://madebyevan.com/webgl-water/) — physical motion reference. Useful to study how light gathers; not a recommendation to add its water simulation.
- [kynd: Reflection and Refraction](https://www.kynd.info/writing/reflection-and-refraction/) — optical behavior and shader foundations.

## Boundaries and next evaluation

Keep DialKit as tuning controls for the same scene. Do not add a style selector or all seven effects. Start with one localized caustic plus improved penumbra. Keep the accepted transient text-contrast behavior.

Judge paired light/dark stills and a motion capture before retaining a new effect. Check narrow layout, reduced motion, highlight clipping, neutral base outside the light, and GPU timing against the existing renderer. Reject full-page water, constant rainbow dispersion, cursor spotlights, and stacked bloom/dust/god rays unless a later change in art direction explicitly calls for them.

The team verified primary articles and linked demo URLs using native web and agent-reach discovery. The exact requested Codrops search URL failed native retrieval; individual articles, including HAOQI, were accessible. Demo motion was not independently recorded or benchmarked. Source code and asset licenses need verification before reuse; these proposals require neither Three.js nor React Three Fiber.

## Team reports

- [Caustics and glass](./design-caustics.md)
- [Codrops and DOM/WebGL composition](./design-codrops.md)
- [Light physics and art direction](./design-light-direction.md)
