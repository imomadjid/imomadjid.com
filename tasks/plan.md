# Sunlit motion with vgpu

Status: implemented locally on the homepage on 10 September 2026. The user corrected the initial lab placement: this effect belongs on `/`. DialKit tunes one effect; it is not a style switcher. See [todo.md](./todo.md) for verified results and remaining validation limits. The sections below preserve the original design and proposed evaluation scope.

## Recommendation

Use one WebGPU canvas, managed by vgpu, with two small WGSL render passes. The first computes soft projected light and shadows at reduced resolution. The second combines that light with a sharp, stationary material surface. Keep the portfolio content in HTML.

This is a controlled 2D projection with depth cues. A full 3D scene, volumetric ray marching, and a physics simulation would add cost without being necessary for the reference view. The performance hypothesis is that controlled sampling and smaller render targets can cost less than Sunlit's large CSS backdrop blurs and animated SVG filter. WebGPU alone does not establish that advantage. CSS effects already receive GPU acceleration in browsers.

## Visual contract

The reference is a tactile surface near a window. Its light implies an environment outside the screen.

- Material, fine grain, grid, text, and layout remain stable during ambient motion.
- Leaf silhouettes move slowly and deform locally. They must remain recognizable as foliage, without looking like smoke, liquid, or a sheet sliding back and forth.
- Blinds remain rigid during ambient motion. Only the theme transition changes their opening and projection.
- Both shadow patterns use the same window direction. Shadows become softer across the receiving surface as apparent separation increases.
- Light is restrained and colored by the surface. Highlights do not turn the page into a glowing overlay.
- Day-to-night closes the blinds, shifts the projection, reduces illumination, passes through sunset colors, and settles into a cool dark state. Night-to-day follows its own dawn palette.
- Input stays responsive during the transition. A second theme change reverses from the current state rather than restarting from an endpoint.
- The composition must still work as a static image.

The cutting-mat pack is a material and composition reference. The homepage uses a neutral matte surface. Grid strength is a tuning parameter, initially zero. The foliage SVG is original geometry; neither the wallpaper artwork nor Sunlit's leaf asset is bundled.

## Evidence and version boundary

Current vgpu documentation provides `init`, `surface`, `target`, `effect`, `frame`, and `frameLoop`. WGSL uniforms and textures are supplied with `effect.set`. An offscreen target can be sampled by a later pass. Surface options include explicit pixel size, DPR, alpha mode, and color space. The WGSL Vite loader is `wgslVitePlugin` from `@vgpu/wgsl/loader-vite`.

The upstream default branch is `canary`. Some documentation snippets use older forms of the API. Before implementation, resolve and pin a published version and use its bundled documentation and types as the API authority. Do not assume the older API used in another project matches the current README. Verify the exact texture upload, compilation, loss notification, and loop lifecycle APIs against that version.

Sources inspected:

- [vgpu repository and current quick start](https://github.com/vercel-labs/vgpu)
- [Getting started](https://vgpu.sh/docs/guides/getting-started)
- [Effects and chaining render targets](https://vgpu.sh/docs/concepts/effects)
- [Canvas surface options](https://vgpu.sh/docs/reference/vgpu/surface)
- [Initialization and unsupported-device errors](https://vgpu.sh/docs/reference/vgpu/init)
- [Pass profiling](https://vgpu.sh/docs/guides/optimize-pass)
- [Sunlit CSS](https://github.com/jackyzha0/sunlit/blob/main/index.css)
- [Sunlit SVG filter and layer structure](https://github.com/jackyzha0/sunlit/blob/main/index.html)
- [Cutting Mat Wallpaper Pack](https://robertmccombe.gumroad.com/l/Cuttingmat-wallpaperpack)

Context7 resolved `/websites/vgpu_sh` and supplied documentation extracts. Direct web reads of some vgpu documentation pages failed; the repository README and Context7 extracts were available. API examples in this plan describe the architecture, not a compiled implementation.

## Rendering design

```text
Resolved theme + transition state + elapsed ambient time
                         |
                         v
Pass 1: projected blinds + warped foliage + soft light
           reduced-resolution lighting texture
                         |
                         v
Pass 2: fixed material + fine grid + grain + lighting
                   canvas background
                         |
                         v
Browser composition: HTML content and controls above canvas
```

### Pass 1: projected lighting

Define a receiving plane and an inverse projective transform that maps its coordinates into window coordinates. Use one aspect-correct coordinate system so the window does not stretch on resize. Derive or invert the forward transform; do not apply Sunlit's DOM transform directly to fragment UVs.

Generate the blind slats with a periodic stripe function clipped to a finite window region. Opening changes the stripe coverage. Anti-alias edges with pixel derivatives so thin gaps do not flicker. Window bars, if visible in the chosen reference crop, share this projection.

Upload one small grayscale leaf silhouette once. Distort its sampling coordinates with a slowly evolving, low-frequency displacement field. Start with two noise scales and unequal time rates: broad branch movement and much smaller local movement. Apply the foliage warp to foliage only, before projecting its shadow. Anchor branch-heavy regions and limit displacement so the silhouette does not melt. Keep the noise seed fixed.

For softness, start with eight fixed aperture samples per lighting pixel. Each sample evaluates blind transmission and leaf transmission with coherent light offsets. Multiply transmission before averaging. This allows overlapping objects to block the same light instead of stacking unrelated dark overlays. Scale the aperture footprint with an art-directed distance field and the projection scale. This approximates a penumbra; it is not an exact physical recreation of Sunlit's blur filters.

Keep the sample pattern stable over time. Do not introduce random sampling each frame. If eight samples show bands or duplicate leaf edges, compare sixteen samples at the same resolution. If that remains inadequate, test prefiltered foliage levels or a small separable blur of the combined mask. Add the extra pass only when the visual comparison demonstrates the need. Allocating mip levels alone does not create their contents.

Start the lighting target at half the canvas width and height, which gives one quarter of its pixel count. Low-resolution rendering is appropriate for soft lighting, but it must not erase the sharper shadows near the window. That edge is an explicit acceptance test.

### Pass 2: material and final color

Sample the lighting texture with linear filtering. Draw the material, optional grid, and static grain at the canvas output resolution. Keep coordinates tied to CSS-pixel scale so line spacing and grain size remain stable when the rendering resolution changes. Apply derivative-based anti-aliasing to grid lines.

Use this conceptual color model in linear light:

`surface color = material × (ambient light + direct light × transmission) + restrained bounce light`

The grid is part of the material and receives the same light. Convert colors correctly at the input and output boundaries; avoid double gamma conversion. Keep grain fixed in surface coordinates. Do not animate grain or add a bloom pass by default.

HTML text stays sharp and selectable above the canvas. This first design does not physically shade each glyph or opaque UI panel. That is a known difference from a literal printed object. Check whether it reads convincingly in the study. Do not rasterize the DOM to solve it. If a shared lighting overlay proves necessary, treat its compositing and contrast costs as a separate, measured change.

## Motion design

Use an elapsed-time controller outside React rendering. Update one small uniform structure. React owns mounting and controls, not frame-by-frame state updates. The existing `motion` package is available if its imperative timeline helps; no additional animation library is needed.

Expose only these development controls initially: ambient speed, leaf displacement, blind opening, light angle, softness, light intensity, and transition progress. Reuse the existing development-only DialKit. Add a seed and frozen-time setting for repeatable captures.

Proposed starting timings, to be tuned by visual comparison:

| Track                | Starting behavior                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Ambient foliage      | Broad movement over roughly 12–20 seconds, with smaller local movement at a different rate                     |
| Day to night         | About 1.7 seconds for the main transition, based on Sunlit                                                     |
| Night to day         | About 1.0 second, based on Sunlit                                                                              |
| Final light settling | A small residual change, allowed up to 4 seconds only if it remains perceptible and does not feel unresponsive |

Drive opening, projection, intensity, bounce, and palette from a shared transition state, with separate easing curves. Interpolate physical parameters and construct a valid projection, rather than blending arbitrary matrices that can become singular. Use explicit sunrise and sunset color stops. On reversal, capture the current parameter values and retarget them continuously. Do not reset ambient time during a theme change.

The prototype should allow scrubbing to 0%, 25%, 50%, 75%, and 100%, as well as real-time playback. Scrubbing is for inspecting spatial coherence; playback is required to assess the motion.

## Portfolio integration

Current inspection found a TanStack Start/React site on `master`, with existing uncommitted changes in the root, homepage, theme toggle, styles, and package files. Preserve those changes. This planning task adds documents only.

Proposed ownership:

- `src/components/ambient-light.tsx`: client lifecycle and decorative canvas.
- `src/lib/ambient-light.ts`: GPU resources, elapsed time, uniforms, rendering, and cleanup.
- `src/shaders/ambient-light.wgsl`: projected shadow and lighting pass.
- `src/shaders/ambient-surface.wgsl`: material and final composition.
- `public/ambient/`: original or licensed foliage mask and static fallback assets.
- Existing `src/lib/theme.ts`, `src/styles.css`, and route files: minimal integration after the study passes.

Load the renderer dynamically after hydration. The server-rendered page must remain complete and readable before GPU initialization. Use a decorative canvas with `aria-hidden` and `pointer-events: none`. Place it behind content in a controlled stacking context; preserve FF surface tokens and overlay elevation.

Use the current theme store as the only preference authority. It supports light, dark, and system, plus cross-tab storage changes. The renderer needs the resolved light/dark state, not the literal `system` preference. Inspection found that system media changes apply the root class without notifying the existing preference subscriber. Add a narrow resolved-theme notification or observe the resolved root class so the renderer stays synchronized.

The existing CSS color transition lasts 180 ms. Do not leave that independent of a 1.7-second sunset. During the lighting transition, use scoped foreground tokens that remain readable over the actual background trajectory. Check the worst local lighting under body text, links, and controls at all five captured phases. A continuous dark-to-light text interpolation can itself pass through unreadable mid-tones. Prefer a measured foreground switch at a safe luminance point; if no overlap exists, constrain illumination under content or adjust the palette. At rest, return control to the normal theme tokens.

Start at the already-resolved theme without a sunrise on initial load. Reveal the canvas only after the first correct frame. On resize, update coordinate scales and replace size-dependent targets, releasing old ones. Handle unmount during asynchronous initialization, React development remounts, and device loss without duplicate loops or leaked resources.

## Performance and fallback

These are proposed budgets, not measured results:

- Aim for a total effect GPU time below 3 ms at p95 on the user's desktop, at the agreed viewport and quality. Record the device and pixel dimensions with the result.
- Target 60 fps during transitions. Compare 30 fps and 60 fps ambient rendering; choose 30 only if motion remains convincing and its resource use is lower.
- Start with a DPR cap of 1.5 and a separate half-resolution lighting target. Tune after checking grid sharpness and near-window shadows on Retina displays.
- Create textures, samplers, pipelines, and buffers once. Precompile before revealing the canvas. Do not allocate GPU resources, upload images, read pixels back, or wait for GPU completion each frame.
- Stop drawing when the document is hidden. Pause ambient elapsed time to prevent a visible jump on return. If light is fully absent at night, render once and sleep.
- With reduced motion, draw a fixed scene and apply theme changes without ambient movement. With unavailable WebGPU, initialization failure, or device loss, show the static material/shadow fallback. No second animated WebGL renderer is proposed.
- On a constrained device, lower lighting resolution before changing the final grid resolution. Then lower ambient cadence. Do not silently reduce quality during benchmark comparisons.

Two render passes mean two full-screen triangles. They do not mean the work is free: the final pass still touches every output pixel, and continuous GPU activity can affect energy use. Measure browser paint/composition and memory as well as GPU time. A JavaScript animation-frame interval is not a GPU timer. Use optional timestamp queries where supported, and label wall-clock measurements separately.

## Implementation sequence

1. Capture the original and define the comparison setup. Pin vgpu and verify one minimal client-side effect.
2. Produce convincing static day and night scenes with a scrub control.
3. Add ambient foliage movement and compare against the reference over time.
4. Add the interruptible theme transition and test text contrast throughout it.
5. Integrate the accepted study into the existing page and complete lifecycle/fallback handling.
6. Benchmark, tune the measured bottleneck, and produce matched visual evidence.

Detailed acceptance criteria, file ownership, dependencies, and checks are in [todo.md](./todo.md). The first reviewable deliverable is the standalone study, with neutral and grid surfaces, replay, and frozen-time captures. Production implementation and deployment have not been requested in this planning turn.

## Acceptance evidence

Compare the original CSS effect, the vgpu study, and a static baseline on the same browser, viewport, DPR, and device. Run each separately in a visible tab. Warm up, then record a 30-second ambient interval and repeated theme transitions. Repeat three times to expose variation. Compare both matched appearance and matched output dimensions; a faster but visibly degraded result does not satisfy the goal.

Capture all five transition phases plus a short ambient recording. Inspect desktop, narrow mobile, and landscape layouts. Check fixed surface coordinates, rigid blinds, irregular foliage, softness gradients, color banding, text readability, and mid-transition reversal. Test rapid toggles, system theme changes, resize, tab hide/show, reduced motion, unavailable WebGPU, initialization rejection, and resource cleanup.

Run the pinned version's WGSL validation command, `bun run check`, and `bun run build` for implementation changes. Add small behavioral tests for transition reversal and resolved-theme synchronization if those introduce new logic. Browser evidence is required for visual acceptance; mocks and shader validation cannot prove appearance or performance. Real mobile hardware is required before claiming mobile performance. If it is unavailable, report mobile performance as unverified.

Retain compact captures and measurement summaries. Remove only disposable artifacts created for this implementation. No build or performance result is claimed by this plan.
