# Pointer motion design research

Read-only design track. 10 September 2026. No application code changed.

## Recommendation

Use **a mouse-driven breeze through the foliage**, over an independently visible idle breeze. Keep the projected window and the page fixed. A horizontal sweep should bend nearby leaf shadows in its direction; the leaves should coast, recover, and return to their ambient motion. This gives an immediate cause and response without making the sun chase the cursor. This is a breeze cue, not a camera-parallax or moving-light-source cue.

Trial the foliage response first. Add a very small glass-caustic wobble from the same impulse only if the first trial still feels disconnected. Avoid a cursor spotlight, whole-page liquid distortion, or moving text. The surface must remain the site's neutral surface color.

## Current code evidence

`src/shaders/ambient-light.wgsl` has time-driven wind and a shared sun/moon projection. Foliage displacement is `wind * 0.016 * movement * anchor`, and the default movement is 0.45. The leaf lookup further scales coordinates by 0.48. Its small displacement is also softened by 12 aperture samples. This explains why small motion may become difficult to see, but this track has not measured its visible pixel amplitude.

`src/lib/ambient-light.ts` has no pointer input. It already has a requestAnimationFrame loop, a reduced-motion condition, visibility handling, and animated uniform updates. The pointer trial can extend this path without a renderer, library, or additional render pass.

## Creator references

### Robin Delaporte — Mouse Flowmap Deformation with OGL

[Creator tutorial](https://tympanus.net/codrops/2019/09/25/mouse-flowmap-deformation-with-ogl/) · [Demo](https://tympanus.net/Development/FlowmapDeformation/) · [Source](https://github.com/robin-dela/flowmap-effect)

The implementation turns mouse position and velocity into a persistent flow texture. Sampling its XY channels offsets image UVs; dissipation controls how the trail fades. The source describes a 128-pixel default target. This is useful as a model for motion that has direction and memory. For this portfolio, carry the input dynamics across but apply them only to leaf sampling. A full flow texture is unnecessary for the first trial.

Verification: article and implementation excerpts read. Opened the live demo in the built-in browser, but it showed a black content area. No visible motion was verified.

### Frank Reitberger — Volatile Nexus

[Creator article](https://tympanus.net/codrops/2026/08/31/volatile-nexus-tinkering-with-glass-caustics-cubes-and-sound-in-three-js/) · [Demo](https://dasprinzip.com/tinker/day42/)

Reitberger maps cursor speed to bounded impulses. A damped spring returns repelled objects, while a fixed impulse pool drives glass waves that also affect refraction and caustics. The transferable idea is one input signal producing coordinated effects and a visible recovery. The portfolio does not need its geometry, audio, or complete optical simulation.

Verification: creator article and linked demo URL verified through web retrieval. The live animation was not watched in this track.

### Tomoyuki Nakata — Pointer Square Lens Distortion

[Creator tutorial](https://tympanus.net/codrops/2026/08/25/building-a-mouse-following-square-lens-effect-with-three-js-and-glsl/) · [Demo](https://tympanus.net/Tutorials/PointerSquareLensDistortion/) · [Source](https://github.com/tomoyukinakata/pointer-square-lens-distortion)

Nakata normalizes mouse coordinates, smooths their approach to a target, and combines a bounded lens mask with image distortion in a fragment shader. The tutorial explicitly avoids extra post-processing targets and 3D models. Its small input system is more relevant here than its square frame or RGB styling. Use time-based damping rather than a fixed per-frame lerp factor when adapting the idea.

Verification: article and code excerpts read. Opened its live demo in the built-in browser. It remained on a loading line during the observation, so no live pointer response is claimed.

### Maxime Heckel — Shining a Light on Caustics

[Creator article and interactive examples](https://blog.maximeheckel.com/posts/caustics-in-webgl/)

Heckel's examples connect the light position, an object's normals, and a projected caustic. The implementation uses render targets and compares projected surface areas to estimate concentration of light. The design lesson is that a caustic should react to the same cause as its implied glass, rather than merely sliding after the pointer. For our procedural crescent, a shared spring impulse can vary its bend and spread slightly without claiming physical simulation.

Verification: source article and implementation text read. Embedded interactions were not operated in this track.

## Proposed input contract

All numbers below are starting proposals, not measurements or accepted defaults.

| Phase                   | Response                                                                                                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idle                    | Leaf tips make a readable change within the first 2–3 seconds, with a roughly 3–5 second sway cycle. Aim initially for 6–12 CSS pixels of movement in the visible right-side cluster, then judge at the actual viewport. Branch roots stay anchored. |
| Pointer enters          | Initialize at the incoming position without a jump from screen center. No light bulb or cursor marker appears.                                                                                                                                       |
| Slow sweep              | Normalized pointer velocity starts a visible directional bend within about 100 milliseconds. A broad radius, approximately 20–30% of viewport width, makes it easy to discover.                                                                      |
| Faster sweep            | The same bend gains strength, capped at a proposed 12–24 CSS pixels at leaf tips. It must not displace the whole canopy.                                                                                                                             |
| Pointer rests           | Input energy fades. The branch finishes its motion and recovers over about 0.8–1.4 seconds. Ambient breeze continues.                                                                                                                                |
| Pointer leaves          | Stop accepting new impulses and smoothly dissipate existing energy. Do not snap to zero.                                                                                                                                                             |
| Optional glass coupling | The same impulse adds at most about 2–4% bend/spread change to the existing crescent, with a slower recovery. Do not make the caustic follow the cursor position.                                                                                    |

This should be noticeable because moving leaf edges and the brief follow-through have a clear temporal contrast with fixed blinds. Increasing the whole scene's brightness, saturation, or speed is unnecessary.

## Small implementation trial

1. Add passive pointer input to the existing host. Store position, recent velocity, and one bounded two-dimensional spring in the renderer closure. Do not update React state per pointer event.
2. Advance the spring using elapsed seconds in the existing draw loop. Pointer events only update targets. Keep drawing until the spring settles, including when ambient speed is zero. Clear the velocity when the page becomes hidden to prevent a resume impulse.
3. Send position and bend as a few scalar uniforms. In the light pass, calculate a smooth radial influence in screen coordinates and add it to leaf displacement. Preserve the current shared window homography. Calculate this outside the aperture loop. No new texture or GPU pass is needed.
4. Keep DOM text, stationary grain, and blind geometry unchanged. Fade influence over the central reading area and ignore pointer events from DialKit, so tweaking controls does not constantly stir the scene.
5. Add only strength and recovery controls to DialKit if needed. They tune this interaction, not scene variants. Reset restores them.

## Touch, reduced motion, and acceptance

- Fine pointer only for the first interaction trial. Touch users get the improved idle breeze. Do not capture scroll, create drag gestures, or add device-orientation access.
- Reduced motion disables both the idle oscillation and the pointer spring. Preserve the settled scene and ordinary links.
- Watch 10 seconds at rest, then slow and fast sweeps, then 3 seconds after leaving. Repeat in day and night. Record the actual screen: changed uniforms do not prove visible motion.
- Compare the same scene before and after at desktop and mobile widths. Confirm the foliage is visible without requiring the cursor, the page remains readable, and normal links still work.
- Measure frame and GPU time on the existing profile path. The proposed no-extra-pass design is a low-cost hypothesis until measured.

Research used agent-reach's Exa route and native web verification of creator sources. Live demo loading limits are recorded above. No claim of performance or visual acceptance follows from source inspection alone.
