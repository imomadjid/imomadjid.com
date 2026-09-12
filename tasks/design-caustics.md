# Light through glass: design research

Research date: 2026-09-10. Proposals only; no renderer changes.

The likely term is **caustics**: concentrated light patterns from reflection or refraction at a curved surface. Maxime Heckel's [caustics article](https://blog.maximeheckel.com/posts/caustics-in-webgl/) explains a normals-and-render-target approximation. His [portfolio](https://maximeheckel.com/) and [article index](https://blog.maximeheckel.com/#articles) were checked directly. His current portfolio links its caustics example to a [WebGPU demo](https://r3f.maximeheckel.com/webgpu/caustics).

These concepts preserve the neutral surface, stationary HTML, and one coherent lighting scene. DialKit would expose small material controls, not a style selector. Costs below are relative design estimates, not benchmarks. Do not stack all four effects by default.

## 1. A glass crescent at the window edge — recommended

- **Appearance:** One incomplete, softly doubled arc of light in the lower-right margin. A faint shadow beside it makes the highlight visible against an almost-white surface without raising the whole background exposure.
- **Physical cue:** Sunlight focused through the rim or base of an unseen glass on a nearby sill. This is a designed suggestion of a glass caustic, not an optical simulation.
- **Motion:** The arc stretches and shifts with the same sun/moon projection. Its settled state is almost still. If a water-filled glass is implied, use barely perceptible deformation rather than endless rotation. Moonlight makes it much weaker.
- **Fit:** Adds a recognizable second material to the existing room. Restrict it to the margin so it does not compete with the name and body copy.
- **Cheap WGSL proposal:** Evaluate two distorted elliptical distance bands and a broad dim shoulder in the existing light pass. Transform them through the shared window projection. Use derivative-based antialiasing and bounded intensity. This adds arithmetic but no texture or render target. It approximates a chosen pattern; it cannot reproduce arbitrary glass geometry.
- **Relative cost / risk:** Low incremental cost. Medium visual risk if it resembles a decorative ring or becomes a bright white blob. Keep the shape incomplete, asymmetric, and anchored.
- **Inspiration:** [Heckel: caustics](https://blog.maximeheckel.com/posts/caustics-in-webgl/) · [demo](https://r3f.maximeheckel.com/webgpu/caustics). The proposal is original; no source code copied.

## 2. Old window glass gently bends the shadow edge

- **Appearance:** Slightly bowed window and leaf-shadow edges, with soft variations in the light between them. Most of the page remains untouched.
- **Physical cue:** Uneven glass bends transmitted rays. It should affect the projected light, not make the page itself look liquid.
- **Motion:** Keep the glass distortion fixed in window coordinates. Only the moving light source changes how strongly that distortion appears. Constant swimming would wrongly imply liquid glass.
- **Fit:** Deepens the existing scene with almost no new visual object. It can help the blind pattern feel less like a CSS stripe gradient.
- **Cheap WGSL proposal:** Add a low-frequency analytic height slope to the projected light coordinates before blind/foliage evaluation. Apply it once outside the softness sampling loop. Two smooth sinusoidal components are enough for an initial study; avoid noisy high-frequency warping.
- **Relative cost / risk:** Low, with no new pass. Low distraction. Excessive curvature could make the blind geometry look broken.
- **Inspiration:** [Heckel: refraction and dispersion](https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/) · [refraction demo](https://r3f.maximeheckel.com/refraction) · [fluted-glass demo](https://r3f.maximeheckel.com/fluted-glass). The fluted-glass link is verified from his portfolio; its animation was not visually inspected in this research pass. Our proposal uses the optical cue, not the demo's complete 3D material.

## 3. A tiny prism fringe, only at grazing sunlight

- **Appearance:** A narrow amber-to-violet trace at one bright patch boundary. It appears briefly during the low-sun part of a transition and fades at its endpoints.
- **Physical cue:** Dispersion separates wavelengths by their refractive index. It belongs at a refracting edge, not around every shadow or HTML character.
- **Motion:** The fringe shares the projection and grows briefly as light grazes the imagined glass edge. No independent hue cycling.
- **Fit:** Gives the transition a distinct, memorable moment without tinting the main surface yellow.
- **Cheap WGSL proposal:** Evaluate an analytic edge three times with tiny offsets for RGB, then gate it by the light patch and transition phase. Avoid taking three copies of the entire 12-sample shadow calculation. No new pass required.
- **Relative cost / risk:** Low if analytic; medium if implemented with repeated texture sampling. Medium-to-high aesthetic risk: strong RGB separation looks like a digital glitch. Start almost invisible.
- **Inspiration:** [Heckel: refraction and dispersion](https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/) · [demo](https://r3f.maximeheckel.com/refraction). His article uses separate refraction behavior by color; our edge treatment is a cheaper art-directed approximation.

## 4. Reflected water light reaches one corner

- **Appearance:** Broad, broken ribbons of light move slowly over a small corner, as if sunlight reflects from water outside the room. Avoid a full pool-floor web.
- **Physical cue:** A rippled water surface redirects and focuses light. Evan Wallace explains how ray convergence can be estimated from the ratio of the original and refracted areas. His [article](https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c) also notes that the method can apply to surface reflections. [Interactive water demo](https://madebyevan.com/webgl-water/).
- **Motion:** Two long, nonmatching wave periods deform the pattern slowly. No pointer-generated ripples or large traveling rings. Fade the reflected contribution down at night; do not imply equal sun and moon brightness.
- **Fit:** Strongest expansion beyond Sunlit. It implies a place beyond the window. This is a different environmental story, so first show an isolated study before adopting it for the homepage.
- **Cheap WGSL proposal:** Begin with a small original grayscale caustic texture, sampled twice with different slow warps and masked to the corner. This is an animated image approximation, not physically generated caustics. A later, more physical version needs a wavefront mesh, refraction onto a receiver, and additive accumulation into a small light target. Do not assume a fragment-only noise field is equivalent to that pipeline.
- **Relative cost / risk:** Low-to-medium for two texture reads; materially higher implementation and GPU cost for the wavefront pass. Highest distraction risk here, since coherent water motion is easy to notice while reading.

## Reuse and evidence limits

All recommendations are design inference from the primary sources. Exa via agent-reach provided discovery; native web verified articles and demo URLs. Article diagrams and explanations were inspected as web content. GPU demos were not played or profiled, so this report makes no frame-rate or visual-runtime claim. Agent-reach reports version 1.5.0 current.

Heckel also links [N8python/caustics](https://github.com/N8python/caustics) as prior work. Source visibility is not a reuse grant. No repository license was verified here; treat linked shader implementations and assets as references until the exact file and license are checked. The recommendations do not require adding Three.js or React Three Fiber to the vgpu project.

**First study:** the glass crescent. It adds material and a light-source story with small cost and a limited footprint. Tune its placement, focus, and intensity in the existing DialKit panel.

**Reject for this homepage:** a full-screen refractive water surface with rainbow dispersion and pointer ripples. It would turn the reading surface into the main attraction, invite further interaction controls, and add rendering cost without supporting the portfolio content.
