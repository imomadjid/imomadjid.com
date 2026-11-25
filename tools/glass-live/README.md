# Live glass fixture

The close button in the Gallery's See more overlay is live liquid glass: a WebGPU renderer
(`src/lib/live-glass.ts`, `src/shaders/live-glass*.wgsl`) that refracts, frosts and tones the
photos behind it the way iOS 27's `.glassEffect(.regular)` does. Its look comes from a material
file, `src/lib/live-glass-material.json`, which is fitted to iOS simulator captures. This folder
holds everything that fitting needs: the same scenes on both sides, the tools that capture them,
the fit itself, and the comparisons.

## How the model works

The model fits a 56 pt circle, the overlay's close button. At each pixel inside it, d points in
from the edge:

1. **Bend.** The pixel reads the backdrop `pull(d)` points closer to the middle. The pull is
   about 23 pt at the rim and 0 from 14 pt in, so the middle doesn't bend and the rim shows
   content from near the centre. That is why the gap between two photo columns sweeps out into a
   cap at the top and bottom of the glass.
2. **Frost.** The backdrop is raised to a power (`gamma`: about 1.56 in light mode, 0.70 in dark)
   and split into two shares. About 30% is the backdrop at half the 3x screen's resolution (the
   web composes at 3x on any screen to match). The rest is blurred about 15 pt wide. The two are mixed and the power is undone.
3. **Saturation.** Colour is boosted about its luma (about 2.0 in light, 1.5 in dark).
4. **Tone.** `offset + gain * base + curve * base²`, read from tables over d and the edge's
   angle. The tables also carry the rim light, the hairline and the drop shadow outside the
   shape.

The comment at the top of `fit.py` and the shader headers say the same thing in more detail.

## What you need

- Xcode with the iOS 27 simulator runtime, and an iPhone 16 Pro simulator named `GlassTints`.
  To create it:

  ```bash
  xcrun simctl create GlassTints "iPhone 16 Pro" com.apple.CoreSimulator.SimRuntime.iOS-27-2
  ```

- `xcodegen`, `uv` (it brings numpy, scipy and Pillow), `ffmpeg` for the motion videos, and
  Google Chrome (the web tools drive it with `playwright-core`).
- The dev server (`bun run dev`) on port 3000 for every web step. Set `URL` to use another
  address and `CHROME` for another browser.

Commands below run from the repository root, with captures in `tools/glass-live/out`, which git
ignores. Use the absolute path: `capture.sh` and `record.sh` change into this folder, and the
Bun scripts don't.

```bash
export OUT=$PWD/tools/glass-live/out
```

## The scenes

`bun tools/glass-live/scenes.ts` writes `Scenes/scenes.json` and the pattern PNGs. The SwiftUI
app (`Sources/`) and `/dev/live-glass` both lay out each scene from that file, so a capture from
either side lines up pixel for pixel. Every scene is a 402 × 874 pt screen with the button where
the overlay floats it.

| Scenes                           | What they measure                                                 |
| -------------------------------- | ----------------------------------------------------------------- |
| `gallery-*`, `scrolled-*`        | The overlay's real four-column masonry                            |
| `grid-*`                         | A 1 pt line every 8 pt: the bend's shape                          |
| `ramp-*`, `saw-*`                | Grey ramps and sawtooths: where each pixel samples from           |
| `step-*`                         | Black beside white: how far the frost spreads an edge             |
| `white`, `grey`, `dark`, `black` | Flat tones: the material's own tint                               |
| `motion-*`                       | Three copies of the masonry scrolling under the glass at 400 pt/s |

## Static loop

1. **Capture iOS.** About 7 s a scene: each is launched twice, with and without the icon.

   ```bash
   tools/glass-live/capture.sh $OUT
   ```

   The first run generates the Xcode project and builds the app; `BUILD=0` skips that later.
   A motion scene takes a scroll offset, so `motion-light@450` holds the strip 450 pt down. The
   fit uses stills every 75 pt along both strips:

   ```bash
   BUILD=0 tools/glass-live/capture.sh $OUT $(for s in light dark; do for y in $(seq 0 75 1500); do echo motion-$s@$y; done; done)
   ```

2. **Fit.** It writes `src/lib/live-glass-material.json` only with `--write`.

   ```bash
   (cd tools/glass-live && uv run --with pillow --with numpy --with scipy python fit.py $OUT --resume --write)
   ```

   - It prints each scene's error, and then the frost it settles on for each scheme, with the
     error over the training scenes and over the held-out ones.
   - The motion stills at 150, 450, 750, 1050 and 1350 pt are held out of every search. Trust
     the held-out number.
   - `--resume` starts from the current material. Without it the fit starts from built-in
     values.
   - `--bevel` also refits the bend to the image error over both schemes.
   - A run takes on the order of ten minutes, and `--bevel` adds much more.

3. **Render the web.** About a second a scene.

   ```bash
   bun tools/glass-live/shoot.ts $OUT
   ```

4. **Compare.**

   ```bash
   (cd tools/glass-live && uv run --with pillow --with numpy python diff.py $OUT)
   ```

   - It prints each scene's mean difference, 0–255 per channel, over the glass and 12 pt around
     it. The total is split into body (more than 10 pt in), rim, and shadow (outside).
   - It writes `$OUT/diff.png`: iOS, web, and the difference ×8 around grey.
   - The flat scenes sit under 1.6.
   - Photo scenes can't go much below about 2. Chrome and iOS resample photos differently even
     outside the glass, so compare against the shadow column there.

5. **Check the web against the model.** If the web is clearly worse than what `fit.py` predicts
   for a scene, the renderer differs from the model, not iOS from either. That's how the
   half-resolution layer and the averaging order were caught.

## Motion

These check that the glass keeps up while the page scrolls.

```bash
BUILD=0 tools/glass-live/record.sh $OUT motion-light
(cd tools/glass-live && uv run --with pillow --with numpy python motion.py offsets $OUT motion-light)
bun tools/glass-live/motion.ts $OUT motion-light
(cd tools/glass-live && uv run --with pillow --with numpy python motion.py diff $OUT motion-light)
(cd tools/glass-live && uv run --with pillow --with numpy python motion.py video $OUT motion-light)
```

1. `record.sh` records the simulator scrolling the strip.
2. `motion.py offsets` finds each frame's scroll offset from the content away from the glass.
3. `motion.ts` renders the web at those offsets.
4. `diff` compares them frame by frame.
5. `video` writes iOS and the web side by side.

The recording is lossy H.264, so `diff` also reports a floor: the same measure over plain
content, which compression alone reaches. Glass error at or under the floor means a match. A
recorded iOS frame matches a lossless still taken at its offset, so iOS glass has no temporal
behaviour to model.

To measure how far the web's glass trails the page:

```bash
bun tools/glass-live/lag.ts $OUT motion-light touch
(cd tools/glass-live && uv run --with pillow --with numpy --with scipy python motion.py lag $OUT motion-light touch)
```

`touch` is a smooth scroll on the compositor, like a finger or a trackpad. `wheel` scrolls in
steps, and `raf` scrolls from the page's own main thread. Scrolling on the compositor runs a
frame ahead of what the page can read, so sources that scroll set `scrolls` and the glass draws
their photos a step ahead. The touch run should report a trail of about 0 pt.

## Where it stands

- **Static scenes:** the web is about 2.1 from iOS on average.
- **While scrolling:** at the H.264 floor in both schemes, and it no longer trails a frame.
- **Largest differences:** iOS still keeps the edges of refracted content a little sharper; the
  `step-light` black side comes out 6–25 levels too bright; `grid-dark` is the worst scene.
- **Cost:** about 2 ms of GPU and 1–1.5 ms of main thread per moving frame on Apple Silicon,
  nothing while still, and about 17 MB of GPU memory.
- **Safari:** checked by eye; it draws as Chrome does. Not measured against the captures.
- **Unfitted:** only the 56 pt circle is fitted; other shapes and sizes reuse it.
