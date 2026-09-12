# Living light: ambient choreography proposals

Research date: 2026-09-10. Scope: design research only. No application changes or benchmarks.

## Recommendation

Make the existing foliage carry the visible idle motion. Add one small, responsive caustic event. Keep the page surface, typography, and window frame still. An observer should notice a branch move within three seconds without moving the pointer. Pointer movement should add a short response, then release into the idle motion.

Do this before adding another effect. More noise would obscure the hierarchy rather than solve the current problem.

## Why the current motion can read as static

These are source-derived findings from `src/shaders/ambient-light.wgsl`, `src/lib/ambient-light.ts`, and `src/lib/ambient-settings.ts`. They are not measured browser timing results.

- The default foliage clock advances at 0.5 times real time. Its main horizontal sine therefore takes approximately 20.6 seconds per cycle; the vertical cosine takes 26.7 seconds.
- The default caustic clock advances at 0.25 times real time. The primary bend takes approximately 71.8 seconds per cycle; the secondary bend takes 109.3 seconds.
- The caustic folds mask is static. Time changes only the small radial bend of the existing crescent.
- Foliage movement is a small UV displacement. Blur can hide that displacement. Increasing speed alone would make the same shape wiggle faster, without introducing branch weight or a stronger gesture.

## Four compatible directions

All ranges below are initial design targets. They need browser tuning at the actual desktop and mobile layouts. Cost descriptions are structural estimates, not GPU measurements.

| Direction                          | Idle motion and timing                                                                                                                                                                                                                     | Pointer response                                                                                                                                                     | Two-pass vgpu implementation and rough cost                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch-led breeze                  | A 5–8 second main sway. Aim for visible outer-leaf travel of 8–18 CSS pixels at desktop, 4–9 pixels on mobile. Secondary tips move 1–3 pixels on a 1–2 second rhythm. The branch root stays fixed.                                         | Filter pointer velocity into a small extra wind impulse. Limit it to about 30% of ordinary sway. Release over 1–2 seconds.                                           | Use anchored rotation/shear of the foliage sampling coordinates, with one slower branch field and one smaller tip field. Keep existing 12 aperture samples. Compute shared displacement outside the loop. A few trigonometric evaluations and vector operations; no new texture or render target required for the first approximation. True independently moving branches would require masks or separately packed branch groups. |
| A passing gust                     | A distinct 2–3 second bend-and-release gesture every roughly 10–18 seconds. Briefly reach 1.5 times idle displacement. Slight overshoot gives the branch weight. No synchronized pulse in every leaf.                                      | Pointer acceleration can request the same gesture, with a cooldown and bounded strength. It should not fire continuously from every pointer event.                   | One envelope evaluated on CPU and passed as a uniform. Delay its influence along the branch field so the gust travels. Negligible extra pass count; no simulation texture needed. Preserve phase when settings change.                                                                                                                                                                                                            |
| Caustic folds that open and close  | Keep the highlight localized at the side. Over 3–6 seconds, two short arcs approach, merge into a brighter cusp, then separate. Their center stays nearly fixed. Displacement is about 5–12% of the local caustic radius.                  | A short pointer impulse near the lit region bends the local folds. Let it settle in 1.5–2.5 seconds. Do not draw a bright ring directly under every cursor position. | Replace static angular segmentation with two time-varying, domain-warped ridges; modulate width and intensity together. Reuse lighting-target green and blue channels for highlight and dim shoulder. Approximately 4–8 extra trig/warp operations in the existing light pass. This is an artistic caustic approximation, not a fluid or photon simulation.                                                                       |
| Passing cloud on directional light | Occasionally soften the shadow and reduce the direct sunlight contribution for 6–10 seconds, with a 25–45 second recurrence. Keep the base surface color fixed. Use a broad directional envelope rather than whole-page opacity breathing. | Pointer does not steer the cloud. It remains an independent environmental event.                                                                                     | One low-frequency 2D field or analytic moving smooth mask affects shadow strength and light tint together in existing passes. No 3D cloud raymarch. A few math operations or one small noise-texture lookup. Secondary priority: this will not solve the first-three-seconds problem on its own.                                                                                                                                  |

## Why this reads as motion instead of decoration

Use one cause per visible event. A breeze bends an anchored branch and its leaves follow with a small delay. A ripple deforms a concentrated light pattern, and the pattern relaxes. A cloud reduces direct illumination and softens the same shadow. Keep each cause spatially coherent.

Avoid uniformly scaling every amplitude, uncorrelated noise on each pixel, animated grain, page-wide brightness pulses, and moving text. Those make the image busy without explaining what moved. The neutral receiving surface should stay stationary through all four proposals.

Mouse interaction is now permitted by the user's current request. Prefer velocity-based impulses with damping over exact cursor following. Read pointer events into refs; pass filtered state to the renderer without React updates per frame. Cap input strength, return to rest on pointer leave, and leave native clicks, scrolling, and text selection intact. Touch can retain idle motion without dragging the page background. Reduced-motion should retain a still scene and avoid idle and pointer-driven displacement.

## References and evidence status

### NVIDIA: procedural wind animation

[GPU-Generated Procedural Wind Animations for Trees](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-6-gpu-generated-procedural-wind-animations-trees) distinguishes trunk and branch motion, composes frequency bands, and discusses phase offsets and inertia. The useful transfer is the hierarchy of movement, not its full 3D skeleton implementation. Article and code reviewed; no linked video watched. All proposed timing and amplitude ranges above are our design choices.

### Maxime Heckel: caustics

[Shining a light on Caustics with Shaders and React Three Fiber](https://blog.maximeheckel.com/posts/caustics-in-webgl/) derives brightness from convergence of refracted rays and uses normal data and render targets. The key design lesson is that bright contours concentrate and change as the refracting shape changes. Article and code reviewed; embedded demos were not interactively watched in this research track. Its full multi-target technique is not the proposed two-pass implementation.

### Evan Wallace: water interaction

[WebGL Water](https://madebyevan.com/webgl-water/) was opened in the built-in browser. I inspected the initial image, dragged across the water, inspected the immediate result, then inspected a later state. The drag visibly produced surface rings and bright projected caustic curves on the floor and sphere; the later image was calm again. This is sampled visual evidence, not continuous video or a timed damping measurement. The useful transfer is a bounded impulse with an observable light response and a return to rest. The portfolio should not copy the pool or render water across the whole page.

### Maxime Heckel: cloud light

[Real-time dreamy Cloudscapes with Volumetric Raymarching](https://blog.maximeheckel.com/posts/real-time-cloudscapes-with-volumetric-raymarching/) is a primary reference for procedural cloud rendering and lighting. Article consulted; no animated demo watched. Borrow environmental variation in direct light, not its volume renderer. A 2D moving light envelope is sufficient for this receiving surface.

### Codrops: interactive landscape discovery

[Interactive Landscape](https://tympanus.net/Development/InteractiveLandscape/) and its [creator repository](https://github.com/ma77os/InteractiveLandscape) are relevant additional exploration paths. The demo page and repository search result were found, but this research track did not visually inspect their motion. They are not evidence for the timing recommendations above.

Agent Reach's Exa backend and native web primary-source checks were both used. Agent Reach reported v1.5.0 current. No social-platform research or performance benchmark was performed.

## Smallest useful next experiment

Implement branch-led breeze plus a damped pointer impulse first. Review a continuous 10-second desktop capture with the pointer still, then a short pointer sweep and release. The branch should show a clear bend within three seconds; the page should still feel calm during reading. Repeat at mobile size and in dark mode, where caustics disappear and foliage must carry the scene by itself.

Then animate the caustic folds. Keep the first version free of a feedback simulation. Compare its motion in normal page context, not an enlarged shader crop. Add the cloud event only if the composition still needs slower variation.

DialKit can tune breeze amplitude and period, gust strength, pointer influence and release, and caustic fold speed. These remain parameters of one scene, not named visual modes. Avoid exposing every internal frequency as a separate control.
