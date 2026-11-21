# Sunlit homepage implementation

Updated 12 September 2026. Local implementation; not deployed.

This record describes the current shader. Earlier caustic, grain/grid, inverse-transform, and 12-sample results described superseded versions and do not validate this implementation.

## Current implementation

- One decorative WebGPU canvas behind the homepage HTML, managed by pinned `vgpu@0.6.0`.
- A half-resolution lighting pass uses 32 disk samples through a tilted blind plane and two foliage masks. The full-resolution material pass combines visibility, irradiance, and the current surface color. Canvas DPR is capped at 1.5.
- The lighting target uses `rg16float` (visibility and irradiance only), so irradiance above 1 reaches the material pass. The foliage mask is `r8unorm` with five populated mip levels.
- The theme-transition sunset tint now follows the light intensity control. Zero intensity preserves the supplied surface color throughout that transition. The independent entrance grading is unchanged.
- Receiver-dependent softness and reduced foliage defocus are deliberate art direction. This is not a physically exact sunlight simulation.
- Motion stays outside React state. Theme reversal preserves the current transition values. Reduced motion, visibility suspension, resize, cancellation, and device-loss fallback have explicit handling.
- The fallback is the neutral CSS surface. There is no caustic, grid, grain, or alternate animated renderer in the current shaders.
- DialKit values persist only in development. Saved browser values can differ from `src/lib/ambient-settings.ts`; use a clean origin to check production defaults without resetting saved tuning.
- The user accepts temporary contrast loss during theme transitions. This change retains that decision and the existing foreground crossover.

## Correctness verification

- `bun test src/shaders/ambient-surface.test.ts` runs the actual material shader on a native GPU. It checks zero intensity across three surface values, five transition phases, and three direction values: 45 states. The test requires a working native WebGPU backend; it does not substitute a mock or silently skip.
- The original zero-intensity probe returned approximately `(0.923, 0.862, 0.825)` for a supplied surface value of `0.9804`. With the fix, all channels return approximately `0.9800`, within half-float precision.
- A native float-versus-unorm lighting probe produced irradiance `1.092773` at angle 10, night 1, softness 0.65, progressive softness 3, beam width 0.7, aspect 1280/720, and the resting aim. The previous target clipped 3,199 of 65,536 pixels. The float target preserves those values.
- Both shaders passed native validation with `bunx --no-install vgpu check <file> --require-validation` during the audit. The material shader was validated again after its fix.
- The independent review accepted the format change, the intensity fix, and the regression test. No new dependency or renderer abstraction was needed.
- `bun run build` passed for the client and Worker. The lazy renderer chunk is about 48.74 kB gzip. The native surface test and the two existing flight tests all pass.

## Performance evaluation

The comparison used the actual shaders and original foliage mask in a minified standalone browser harness, with a 1280 × 720 output and a 640 × 360 float lighting target. Each sample-count variant received a two-second warm-up and three 30-second measurements at a requested 60 fps. The browser used an Apple Metal adapter. This isolates GPU pass cost from React and development tooling; it is not a full-page benchmark or a physical-phone result.

| Samples | GPU median across runs | GPU p95 across runs | Decision                                      |
| ------- | ---------------------- | ------------------- | --------------------------------------------- |
| 32      | 2.228–2.294 ms         | 2.294–2.949 ms      | Retained for soft-shadow quality.             |
| 24      | 1.769 ms               | 1.769–1.966 ms      | Faster, but increased maximum-softness error. |
| 16      | 1.245 ms               | 1.311–1.376 ms      | Rejected; visible broad-penumbra banding.     |

The 32-sample isolated GPU p95 met the proposed 3 ms budget in these runs. Requested 60 fps frame-interval p95 varied from 17.5 to 25 ms; do not infer perfect frame pacing from the GPU result. An additional 30 fps test halved submissions from 1,800 to 900 over 30 seconds, but frame-interval p95 rose to 41.6 ms. The existing refresh-driven cadence is retained. No battery or energy improvement is claimed.

Image comparison used the same frozen scene against a 256-sample reference at default, minimum softness, maximum softness, night, and a transition midpoint. Errors below are RGB code values on a 0–255 scale, after the material pass. The reference is a higher-sample approximation, not physical ground truth.

| Samples | Default mean absolute error | Maximum-softness mean error | Maximum-softness worst error |
| ------- | --------------------------- | --------------------------- | ---------------------------- |
| 32      | 0.212                       | 0.787                       | 4                            |
| 24      | 0.261                       | 0.949                       | 6                            |
| 16      | 0.363                       | 1.404                       | 8                            |

Maximum-softness captures showed increasingly distinct bands at lower counts. Keeping 32 avoids that quality reduction. The test updated sample count consistently in the loop, disk distribution, mip footprint, and irradiance normalization. No experimental sample-count or cadence change was left in the application.

## Browser evidence and limits

The 12 September audit inspected desktop day/night and a 390 × 844 narrow viewport. The narrow page had no horizontal overflow. It also exercised an isolated actual renderer under reduced motion and forced GPU device loss. Simulated `document.hidden` plus a visibility event stopped frame-count advancement; restoring visibility resumed it. These checks are not physical-phone or operating-system suspension tests.

After the fixes, the production preview rendered day and night successfully at desktop and narrow widths. Sunrise and sunset reached the correct foreground tone, the canvas remained in WebGPU mode, and the browser reported no warnings or errors. The narrow page still had no horizontal overflow.

Remaining limits:

- No physical mobile performance measurements or broad browser/device coverage.
- No controlled comparison with original CSS Sunlit or a static baseline.
- No exhaustive frame-by-frame transition contrast or long-run GPU memory audit.
- No claim of behavior in a real browser without WebGPU; the neutral fallback path was inspected and forced device loss was tested.
- Full-page production performance must be distinguished from isolated shader timing.

The audit, native probe, and benchmark source are retained outside the repository in the task's artifact directory. The generated benchmark bundle was removed after measurement. Local build output is about 6.9 MB and is retained for preview. No commit, push, or deployment is part of this update.
