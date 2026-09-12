# Sunlit motion recommendation

10 September 2026. Research followed by an authorized local implementation.

## Current implementation: direct-light geometry

Moonlight visibility: the farther canopy is fixed lower in world space (y = 0.22) and enlarged to 0.85 wall-height units. This lets the moon direction project it onto the visible receiver while the near canopy carries daylight. A small cool direct-light contribution on the dark material uses traced visibility and incident irradiance, so leaf occlusion interrupts the moonlit gaps. The branch does not teleport with the theme.

Canopy visibility follow-up: the near mask is 12% larger around its default center, with slightly stronger opacity in both layers. Foliage receives only 25% of the progressive defocus increase, retaining base emitter softness. Its mask mip level follows that smaller footprint. This intentionally uses a separate angular sampling radius for foliage; central source direction and depth projection remain shared, but the artistic defocus no longer represents one common ray segment through every occluder. The blinds keep their existing progressive softness.

Initial page entry keeps the resolved theme and foreground throughout. Light mode gets a cool dawn gradient with a brief warm direct-light accent; dark mode gets an amber direct-light beam that fades into the normal dark surface. Separate Dawn Entrance and Dusk Entrance easing controls default to 3.2 and 3.6 seconds. A six-degree dawn offset or negative eight-degree dusk offset settles through the shared source angle, moving all projected shadows together. The entrance clock begins with rendered frames, pauses while hidden, and is skipped for reduced motion. A theme switch during entry releases the remaining entrance over 0.35 seconds while the normal theme transition runs. No opposite-theme first frame is introduced.

The user selected the vgpu homepage's geometry-driven approach and asked to focus only on light and shadows. The current shader traces 32 samples from each wall position to a finite disk light source. Each ray intersects a tilted blind plane and two parallel foliage planes. Slat gaps and the original canopy opacity mask determine visibility along that same ray. Source position, plane tilt, and distance now determine shadow translation, scale, and penumbra; the prior homography, inverse daylight mapping, and added parallax offsets are removed.

Softness controls emitter size. Blinds Distance controls the blind plane's position. Foliage Depth moves both foliage planes, and Scale changes their physical mask sizes. The two foliage layers retain independent wind and pointer deformation. Blind opening defaults to 0.76 so the new geometric projection has slimmer shadow bands. Existing saved tuning can be reset through Reset Sunlit.

Grain, grid, the synthetic bounce term, and Material controls have been removed. Glass caustics remain removed. Opacity-map mip levels filter each ray sample's finite footprint to avoid noisy broad shadows; this is not an added grain effect. The pipeline still uses two passes and adds no dependency.

Scope: this is direct geometric occlusion using alpha-masked planes, not full 3D trees or global illumination. The disk represents an art-directed area emitter, not an astronomically calibrated sun. Ray weights include receiver cosine, inverse-square distance, and an elongated angular emission lobe. The light pass retains both visibility and unoccluded irradiance. The composite exposure-normalizes direct light plus constant diffuse fill to preserve the neutral surface token. No bounced light is traced.

The emitter aims just beyond the right edge at rest. Its angular falloff lets diffuse fill dominate toward the left, so both shadow contrast and warmth taper out. This replaces the former screen-coordinate warmth fade. Fine-pointer movement steers the emitter aim with exponential settling; leaving the page, window blur, or entering DialKit returns it to rest more slowly. A resting pointer holds its aim. Reduced motion disables steering. Beam Width and Pointer Influence tune the same scene; they are independent of foliage speed and breeze strength. Steering changes the illuminated region, while source position still determines shadow projection.

Progressive Softness broadens the sampled emitter with wall-space distance from the smoothed light target. A 0.12-wall-height focal radius retains base softness; the increase reaches its maximum at 0.9 wall heights. The default strength of 3 yields up to four times the base emitter radius. Both occluder types use these rays, and foliage mip selection follows their larger footprint. Zero restores uniform emitter size. This receiver-dependent size is an explicit artistic extension, not a physical property of one fixed emitter. It adds no render pass or ray samples.

One vertical support rail now occludes the same rays on the tilted blind plane. Its fixed local position is framed near the right third of the wall. Blinds → Rail Width defaults to 0.018 wall-height units; zero removes it. Its intersections with the slats use combined transmission, so overlapping shadows do not accumulate extra darkness. The rail inherits emitter penumbra, progressive softness, and beam falloff.

Validation: code checks and build pass. The beam follow-up was inspected in daylight and moonlight, including left-side aim and a 66-frame steering capture with samples at 0, 0.4, and 1.5 seconds. One desktop sample reported 1.84 ms median and 4.92 ms p95 GPU time; this is local evidence, not a cross-device benchmark. Earlier geometry checks covered reload, a 390-pixel mobile viewport without horizontal overflow, and a 151-frame 4.97-second idle capture. An analytic sweep of 81,675 ray/plane cases over supported angles, phases, distances, and aspect ratios kept all intersections between receiver and emitter, with plane residual below 4e-16.

## Earlier implementation history (superseded)

Current scope: the user removed glass caustics from the direction entirely. Its shader calculations, renderer clock/uniforms, and DialKit controls have been deleted. Earlier caustic proposals below are historical and are not planned work. The active direction is canopy shadows, window blinds, and breeze.

Projection correction: canopy sampling now derives from the same sun/moon caster coordinates as the blinds. A fixed inverse of the authored daylight projection preserves the accepted default crop. Theme transitions and the light-angle control now move both shadow patterns; wind deformation remains separate. A numeric sweep across aspect ratios 0.37–4 and supported angles/phases remained finite, with default daylight coordinates preserved to floating-point precision. A browser transition capture with idle speed at zero confirmed that foliage shifts with the changing light projection.

Depth follow-up: the canopy layers now have distinct distances beyond the blind plane. Their additional displacement is distance times the change in a shared light-ray slope. The same distances control their penumbra widths. The farther layer therefore has more parallax and a softer shadow, without an independent angle or rotation. Existing Foliage Depth tunes both effects; default daylight placement and softness are preserved because its reference ray offset is zero. This is an artistic layered projection, not a calibrated physical lighting simulation. A 60-frame theme-transition capture with idle wind paused confirmed the revised displacement.

Implemented a new original canopy SVG with short branching clusters and varied overlapping leaves. Two separately moving samples of this mask open and close light gaps. The main wind period is about six seconds at default speed. Pointer sweeps add a bounded directional bend with exponential recovery; no React state changes occur per pointer event. The existing two render passes remain.

Blind spacing changed from 0.18 to 0.12, giving 50% more repetitions in the same projected interval. Caustics default to zero. DialKit now includes foliage scale and breeze strength/recovery; Reset Sunlit restores the new defaults. Existing saved development tuning remains available until reset.

The first version was too sharp. Following the user's correction, the final mask uses clustered leaves and a minimum foliage penumbra. The visual reviewer accepted five final samples at one-second intervals: soft canopy rather than decorative sprigs, with visible motion between the first two seconds and a neutral readable surface.

Validation: `bun run check` and `bun run build` pass. Browser observation included a 300-frame 9.94-second initial idle capture and a 153-frame 4.91-second final capture. Pointer movement and recovery were inspected with idle speed set to zero, then defaults restored. Dark mode, 390-pixel mobile width with no horizontal overflow, and reload were checked. Reduced motion held the frame counter unchanged, including during pointer input. The preview was restored to desktop light mode. These sampled observations do not establish continuous human playback acceptance or performance on other devices. Temporary review images were removed after review; the existing shared build output was retained.

## Observed problem

The parent captured 340 browser frames across 11.91 seconds and inspected full-page samples at 0, 4, and 8 seconds. An independent reviewer compared samples 15.46 seconds apart. Both found that the normal-size page reads as almost static. These are timed frame observations, not a continuous playback assessment or a frame-pacing benchmark. The renderer is advancing; pointer movement has no shader response.

The code supports this finding: the main foliage cycle is about 21 seconds, the caustic deformation cycles are about 72–109 seconds, and the caustic fold mask is static. The fixed blinds carry most of the visible contrast. Small foliage displacement is difficult to see through the soft shadow.

## Recommended next trial

### Prerequisite: recognizable plant geometry

The user's follow-up identifies the silhouette and its scale as a separate problem. Fix this before tuning motion. The current SVG repeats narrow ellipses along seven curved stems; its uniform construction and blurred projection do not give a clear plant identity.

Redraw an original ficus-like branch silhouette with broader pointed leaves, tapered branching stems, short connected leaf stalks, varied leaf angles, and open gaps. Use fewer, larger leaf groups. Favor a cropped branch entering from the right, with enough connected structure visible to read as a plant shadow. Do not add a visible pot or plant illustration.

Tune projected size, crop, and softness together at desktop and mobile sizes. Some leaf edges must retain their shape while others soften with distance. A higher-resolution SVG alone cannot fix an overblurred or poorly cropped projection. Keep the same neutral receiving surface and restrained sunlight tint.

Visual reference: [Botanical on the Wall](https://obrah.com.br/products/poster-botanical-on-the-wall), by Diana en Ronnie, illustrates connected leaves and branch structure against a pale wall. Use it as an observation reference, not an asset to copy. Draw the mask for this composition rather than importing an arbitrary decorative plant icon. Confirm recognition in a still frame before adding the motion below.

### Motion after silhouette acceptance

Use visible foliage motion as the main gesture. Add a mouse-driven breeze, then improve the existing caustic. The user's latest request permits pointer interaction and supersedes the earlier recommendation to avoid it.

All numbers below are initial tuning targets, not measured or accepted defaults.

1. **Idle branch sway.** Start with a roughly 6-second cycle and 8–16 CSS pixels of outer-leaf travel on desktop, scaled down on mobile. Anchor the branch base; let tips follow with a small delay and faster secondary movement. A clear change should be visible within 2–3 seconds. Do not translate the whole foliage mask uniformly.
2. **Pointer-driven gust.** Use pointer velocity to bend nearby leaves in the sweep direction. Aim for initial response within about 100 ms, with a bounded total displacement around 20 CSS pixels. Let the bend settle over about 1.3 seconds after the pointer stops or leaves. Use a broad, soft influence region. Keep the window projection and HTML fixed. Ignore input over DialKit.
3. **Evolving caustic folds.** Over 3–6 seconds, let short bright ridges approach, concentrate, and separate within the existing small patch. Preserve its approximate center. This replaces the current nearly static crescent deformation. Trial a small delayed response to the same pointer impulse only after the foliage response works.

A slow passing-cloud event is a later option. It does not solve the immediate lack of visible motion. Defer cursor spotlights, moving the sun with the mouse, animated grain, and whole-page water distortion: each weakens the current scene or adds an unrelated motion system.

## Implementation boundary

Extend the existing renderer loop with filtered pointer state and a bounded spring. Pass a few uniforms into the current light pass. Compute shared deformation outside the 12-sample aperture loop. Keep the two render passes, original surface color, theme transition curves, reload behavior, and reset control. No new dependency or simulation texture is proposed. Expected cost is low by structure, but must be measured.

DialKit remains a tuning tool for one scene: breeze amount and period, pointer strength and recovery, and caustic fold speed. Touch keeps the idle motion without intercepting scrolling. Reduced motion keeps a static scene. Pause when hidden and clear stale pointer velocity on resume.

## Acceptance for an implementation pass

- Inspect an actual 10-second idle sequence at normal page size. Visible movement must appear within three seconds without pointer input.
- Inspect slow and fast pointer sweeps, rest, and pointer exit. Response must carry direction and recover without a snap.
- Repeat in day and night, desktop and mobile. The neutral base and text remain stable. Night must work without the daytime caustic.
- Recheck theme reversal, reload, reduced motion, DialKit editing, and reset.
- Compare frame and GPU timing through the existing profile path. Do not infer performance from pass count alone.

## Team research and primary references

- [Pointer research](./design-pointer-motion.md): [Robin Delaporte's flowmap tutorial](https://tympanus.net/codrops/2019/09/25/mouse-flowmap-deformation-with-ogl/) supplies directional input and dissipation. [Frank Reitberger's Volatile Nexus](https://tympanus.net/codrops/2026/08/31/volatile-nexus-tinkering-with-glass-caustics-cubes-and-sound-in-three-js/) supplies bounded impulses and spring recovery. Articles reviewed; live motion not verified in this track.
- [Ambient choreography](./design-living-light.md): [NVIDIA procedural wind](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-6-gpu-generated-procedural-wind-animations-trees) supplies branch hierarchy and phase differences. [Maxime Heckel's caustics](https://blog.maximeheckel.com/posts/caustics-in-webgl/) supplies changing light concentration. These inform the design, not the proposed numerical timings.
- [Evan Wallace's WebGL Water](https://madebyevan.com/webgl-water/) was interacted with in the built-in browser. Sampled states showed drag-induced rings, changing projected caustics, then a calmer state. Borrow the impulse and recovery, not the pool renderer.
- [Independent browser observation](./design-motion-observation.md) records the current page's weak temporal change.

The research team used agent-reach's Exa route and native web checks. Some demos did not render in the research browser; their motion claims are explicitly source-based in the individual reports.
