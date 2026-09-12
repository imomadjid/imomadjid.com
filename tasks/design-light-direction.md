# Light direction research

Research-only proposal, 10 September 2026. This track covers creators beyond Maxime Heckel and Codrops. Native web verification and agent-reach Exa discovery were both available. Agent-reach v1.5.0 is current. Source pages and code concepts were inspected; demos were not frame-tested. Costs below are implementation estimates, not GPU measurements.

## Recommendation

Keep one neutral room. Refine shadow depth and introduce one small, slow caustic reflection at the lower-right edge. The scene should suggest an unseen window, plant, and glass of water. The matte receiving surface and HTML stay still. Do not add an aquarium or glass object UI. Caustics is the term the user was reaching for: light concentrated by reflection or refraction.

The next coherent scene combines ideas 1 and 2 below. Idea 3 is an alternative next experiment, not a third moving layer by default. All control names below are proposed tuning controls for the same scene, not modes or presets.

## Ranked ideas

### 1. Depth-separated penumbra

**Appearance:** Keep a crisp suggestion of the window near the right edge. Let distant foliage shadows broaden and overlap. A few recognizable leaf edges matter more than increasing all shadow contrast. This adds spatial depth without adding a new motif.

**Motion:** Branch movement should stay slow; smaller leaf regions can lag slightly. The softness field stays attached to the projected scene as the sun/moon projection changes, rather than always being a horizontal screen gradient.

**Implementation / low-to-medium cost:** Keep the fixed sample budget. Give the blind and leaf masks different conceptual caster distances, using scaled aperture offsets per mask. Derive blur from the shared projection coordinates. Optionally encode per-leaf depth or phase in another texture channel. Test silhouette overlap before adding samples. Controls: caster separation and breeze variation.

**Risk:** Two shadow layers can look like doubled artwork unless their origin and motion agree. Do not put a contact shadow around the HTML.

**Basis:** Bartosz Ciechanowski's interactive [Lights and Shadows](https://ciechanow.ski/lights-and-shadows/) explains how source size and occluder distance change shadow softness. It also provides a useful matte-material reference. [kynd's soft-shadow explanation](https://www.kynd.info/writing/soft-shadow/) is another technical reference; its ray-march loop is not recommended for this flat scene.

### 2. A small caustic reflection from an unseen glass

**Appearance:** One pale, irregular crescent or loose cluster of luminous folds near the lower-right edge. Give it enough dark-side falloff to read against the nearly white surface. Leave the main text region clean. It should imply reflected/refracted light landing on the surface, not a transparent liquid covering the page.

**Motion:** The folds slowly compress, separate, and reform. Avoid simple sideways scrolling. Tie its overall direction and fade to the same source as the blinds. At night, reduce it sharply instead of making an equally bright blue copy.

**Implementation / low cost for an approximation:** Sample an original grayscale caustic texture twice at different scale/direction, combine with `min`, then apply a broad local mask and the scene's light transmission. Use the existing material pass. Start monochrome; keep any spectral fringe under one output pixel. This likely needs two texture reads, not a water simulation or extra render target. Controls: reflection amount, spread, and drift. Validate local highlight clipping in linear color.

**Risk:** Dense repeated cells immediately imply a swimming pool. Large rainbow fringes make it look like a shader demo. A high white base leaves little headroom, so do not dim the entire page to expose the caustic.

**Basis:** Alexander Ameye's [Rendering realtime caustics](https://ameye.dev/notes/realtime-caustics/) describes a controllable texture approximation with directional projection, two samples, masks, and edge fade. Evan Wallace's [WebGL Water demo](https://madebyevan.com/webgl-water/) and [technical explanation](https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c) provide the physical motion reference: the pattern comes from concentration of light. Our crescent placement and restrained treatment are art-direction proposals, not features copied from those demos.

### 3. Passing cloud softness

**Appearance:** The room briefly becomes more diffuse. Shadows lose a little contrast and sunlit warmth recedes, while the neutral base remains stable. This gives the scene time and weather without drawing a cloud.

**Motion:** Use a long, irregular envelope, with broad quiet intervals. Fade both direct light and shadow definition together. Avoid the regular pulse of a breathing animation.

**Implementation / low cost:** Drive two uniforms with smooth, low-frequency noise or a deterministic envelope. Use the same visibility pause and reduced-motion behavior as the existing loop. No additional full-screen pass is needed. Control: sky variation.

**Risk:** Frequent modulation reads as a display brightness fault. Keep the change restricted to the directional-light contribution.

**Basis:** The overcast-light examples in [Lights and Shadows](https://ciechanow.ski/lights-and-shadows/) explain diffuse illumination. [The Book of Shaders: fBm](https://thebookofshaders.com/13/) provides noise and domain-warping techniques. The event timing is our proposal.

### 4. Matte relief revealed by grazing light

**Appearance:** A fine fixed paper/plaster texture becomes slightly easier to see at the shallow sunlight angle, then quieter under moonlight. This extends the cutting-mat reference through material response instead of a stronger global grain overlay.

**Motion:** The texture never moves. Only its directional shading changes during relighting.

**Implementation / low-to-medium cost:** A small repeatable normal texture, or derivatives of a stable low-amplitude height field, modulates diffuse light in the material pass. Keep its physical scale in CSS pixels. Control: material relief. Measure aliasing at fractional DPR.

**Risk:** Strong shading changes matte paper into embossed leather. Animated noise makes the page look dirty or compressed.

**Basis:** [kynd: Specular reflections and diffuse light](https://www.kynd.info/writing/specular-reflections-and-diffuse-light/) supplies the lighting distinction. This is a local design inference, not a claim that the source implements this wallpaper treatment.

### 5. A transient glass-edge glint

**Appearance:** A very thin, mostly colorless light arc enters at the far edge during a sun-angle transition, then fades. It suggests a curved glass surface outside the frame.

**Motion:** The arc changes position because the light source changes. Do not have it orbit or follow the pointer.

**Implementation / medium cost:** An analytic curved band or authored light mask, projected with the source, with bounded brightness and a narrow transition envelope. This can replace the caustic patch, but should not stack on top of it initially. Controls: glint amount and width.

**Risk:** It may read as an arbitrary lens flare without a credible direction. Keep it peripheral and reject it if a still frame cannot explain the light path.

**Basis:** [kynd: Reflection and Refraction](https://www.kynd.info/writing/reflection-and-refraction/) provides the optical model. [Martin Renou's caustics article](https://medium.com/@martinRenou/real-time-rendering-of-water-caustics-59cda1d74aa) and [demo](https://martinrenou.github.io/threejs-caustics/) show a more general refracted-light solution, which is useful inspiration but excessive implementation scope for this receiver plane.

## Reject for this homepage

- Full water simulation, scene-depth reconstruction, or a 3D caustics renderer. The flat receiver does not need them.
- Full-page animated caustic cells. They replace the room with an underwater scene.
- God rays, bloom haze, floating dust, and chromatic fringes all at once. They compete with the typography.
- Cursor-following light or camera parallax. The user should feel a stable surface.
- Equal-strength sunlight and moonlight, or global yellow/blue color washes. Preserve surface-1 as the visual base.
- A style selector. DialKit remains a workbench for intensity, shape, speed, and material settings.

## Acceptance before adding another feature

Compare fixed desktop and narrow-screen crops; verify the neutral base outside the lit area; inspect a 10-second motion segment; compare GPU time against the existing two-pass baseline; and test reduced motion. Do not accept a feature from a still image alone. The accepted transient text contrast behavior stays unchanged.
