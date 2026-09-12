# Codrops light and surface ideas

Research checked 2026-09-10. Research only; no shader changes. Agent-reach Exa discovery and native web verification both returned the sources below. The exact requested Codrops search URL failed in native web twice (internal/safety fetch error); article pages and the WebGL tag index were accessible. This does not establish that the search page is broken in a browser. Demo URLs were resolved from primary articles; continuous demo motion was not browser-recorded in this research pass. Visual descriptions below come from the authors' explanations. Cost estimates and proposed adaptations are design judgments, not measured timings.

Keep one coherent place: neutral matte surface, off-screen light source, HTML text, and quiet motion. DialKit should tune parameters of that place. Do not add a gallery of styles. The user accepts brief text-contrast loss during theme transitions.

## Ranked proposals

### 1. Let the surface catch the light

[Relighting Images with Depth Maps and Three.js — Dominik Fojcik, August 19, 2026](https://tympanus.net/codrops/2026/08/19/relighting-images-with-depth-maps-and-three-js/) · [Demo](https://tympanus.net/Tutorials/RelightingImages/) · [Code](https://github.com/DGFX/codrops-relightning-images)

The tutorial derives normals from a depth map and image brightness, then lights the flat image. It also traces depth samples for self-shadowing. Its useful cue is that fine detail reacts to light direction.

**Adaptation:** Give the existing paper/cutting-mat grain shallow normals. The material stays fixed; its relief becomes visible at grazing sun angles and relaxes under diffuse moonlight. This makes the existing material feel physical without adding a new object or changing its base color. Use an original seamless normal texture or a smooth procedural height field; photographic depth estimation is unnecessary here.

**Cost:** Low to medium: one normal-map lookup plus a dot product in the surface pass. Depth-ray self-shadowing would be materially more costly and is not recommended for this shallow surface. **Risk:** Fine animated contrast can sparkle near text. Keep the grain stationary and low amplitude; test scaling on high-DPR screens. DialKit: relief depth and directional response.

### 2. A slowly passing cloud changes the room

[The Sleepers — Thibaut Foussard, July 10, 2026](https://tympanus.net/codrops/2026/07/10/the-sleepers-creating-an-atmospheric-webgl-experience-with-lightweight-techniques/) · [Demo](https://projects.thibautfoussard.com/the-sleepers/)

This case study animates apparent fog with position-based blending and a moving seamless noise texture, avoiding a volumetric simulation. Domain warping adds irregularity.

**Adaptation:** Use one broad, slow cloud mask outside the window. As it passes, direct light dims and shadow edges soften together, then recover. Let the neutral ambient surface remain stable. A 20–40 second event with long holds is a starting point for art direction, not a source value. This gives sunlight an environmental cause beyond perpetual foliage sway.

**Cost:** Low: one or two low-frequency texture samples in the light pass; no extra full-screen pass. **Risk:** Uniform opacity oscillation looks like screen dimming. Use a broad moving front and restrained direct-light modulation, with no rapid pulsing. DialKit: cloud amount, travel speed, and softness coupling.

### 3. A small caustic from glass outside the frame

[Volatile Nexus — Frank Reitberger, August 31, 2026](https://tympanus.net/codrops/2026/08/31/volatile-nexus-tinkering-with-glass-caustics-cubes-and-sound-in-three-js/) · [Demo](https://dasprinzip.com/tinker/day42/) · [Code](https://github.com/prinzipiell/tsl/tree/main/volatile-nexus)

The experiment combines moving glass, caustics, refraction, and reflections. Its displaced surface drives multiple optical responses, so related effects move together.

**Adaptation:** Imply a drinking glass near the window through a faint, curved caustic near the right/bottom margin. Slow deformation makes a narrow bright fold spread and gather; faint dispersion can occur only at its edge. Gate it by the same direct-light field as the blinds. Do not import the ring, cube swarm, audio, or saturated full-scene treatment.

**Cost:** Medium for an art-directed analytic caustic or small looping field sampled in the existing light pass. A physically derived refractor/receiver setup needs extra geometry and passes; defer it until the visual hypothesis wins. **Risk:** Bright moving filaments compete with type and can read as a swimming pool. Keep the footprint small, low chroma, and outside the main text. DialKit: footprint, intensity, drift, and edge dispersion.

### 4. Keep highlights on a deliberate boundary

[Inside HAOQI.DESIGN — Haoqi, August 15, 2026](https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/) · [Site](https://haoqi.design/)

The exact user-supplied article is available. It describes DOM typography with a canvas for glass/image effects, one frame source for synchronization, and a pointer-controlled rim light constrained to a circle. It also distinguishes its light-theme transmission approximation from its art-directed dark-theme tint.

**Adaptation:** Keep any responsive highlight on a small projected window edge or caustic boundary. Pointer direction may gently bias that highlight, with a damped return. Do not let a mouse-following spotlight wash across the text. A stationary page does not need the article's scroll framework or refraction FBO.

**Cost:** Low for constrained angle interpolation and an analytic edge highlight. **Risk:** Excess pointer tracking changes the scene from ambient room light into an interactive toy. Prefer autonomous motion initially. Its six-ray lens flare is a camera cue and should not be added to a matte wall without a deliberate camera aesthetic.

### 5. Study beam falloff, without importing a hero spectacle

[Replicating the Light Effect from MIDWAM — Yuri Artiukh, January 9, 2023](https://tympanus.net/codrops/2023/01/09/replicating-the-light-effect-from-midwam-with-three-js-and-postprocessing/) · [Replica demo](https://midwamreplica.netlify.app/)

This primary tutorial page links a Three.js/postprocessing light-effect coding session and live replica. The article alone contains little technical detail; the demo resolved but its text response was empty. Treat it as a visual-study lead, not validated implementation guidance.

**Adaptation to investigate:** A very weak broad light veil near the off-screen source, clipped by the existing window field. **Cost:** Low for an analytic approximation; higher for sampled scattering or bloom. **Risk:** Visible rays imply air or a camera rather than a flat material. Keep this below the previous four proposals until a visual study demonstrates a benefit.

## Suggested sequence

First test directional material relief, then slow cloud occlusion. These enrich the current scene with little pipeline change. Sketch the small glass caustic next as the strongest extension beyond Sunlit. Keep it if it supports the room; reject it if it becomes the page's focal point. Do not implement all ideas at once. Use paired still frames and a 20-second capture in both themes before choosing defaults.
