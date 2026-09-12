# Motion observation and design recommendation

Reviewed 2026-09-10. No app source or DialKit tuning values changed.

## Evidence and limits

- Opened an independent built-in browser tab at `http://localhost:3011/`, at 1280 × 720. Collapsed DialKit. The current controls showed foliage movement 0.45, speed 0.5, density 0.8, and caustic drift 0.25.
- The document reported `hidden: false`, reduced motion false, and the WebGPU renderer active. Its frame counter advanced. This proves that frames were submitted; it does not prove that a person sees motion.
- Compared full-size daylight screenshots separated by 15.46 seconds. The window bands stayed fixed. Foliage changed slightly along the upper and middle right edge. The change was difficult to identify without deliberately comparing frames. The caustic at the lower right was faint and did not establish a clear moving feature.
- Moved the pointer from the left side to the right side through browser input. No visible scene response followed. The renderer also has no mouse or pointer input integration.
- Sampled a theme change. Large geometry and brightness differences make this change much more apparent than idle motion. These sparse samples do not establish the quality of every intermediate frame.
- Independently inspected the parent's timed full-size frames at `/tmp/sunlit-idle-observation/frame-0.jpg` and `frame-8.jpg`. They support the same conclusion at 1129 × 948: almost static at normal reading size.
- This review used temporal screenshot comparisons, not human continuous video playback. A later attempt to capture cropped samples produced unsuitable crops and is excluded from the visual findings.

## Why it reads as a wallpaper

The highest-contrast feature is the stationary blind pattern. The animated feature is a much softer, lower-contrast silhouette. At the default movement, the shader multiplies wind by only `0.016 × 0.45`, then scales foliage UVs by 0.48. Blur further hides its displacement. The strongest wind terms take roughly 20–27 seconds for a cycle at speed 0.5. The caustic deformation is slower still, with its main term taking roughly 72 seconds at drift 0.25. These are code-derived periods, not measured frame rates.

The surface reads as calm and clean. The issue is not a lack of rendering or a need to animate the text. There is no clear motion hierarchy that announces a living scene within the first few seconds.

## Recommendation: a breeze that responds to the visitor

Keep the page surface, text, and primary blind structure still. Make the foliage shadow the main moving object.

1. **Idle:** let two foliage clusters sway with different phases. A visible leaf tip should move about 8–16 CSS pixels over a 3–5 second gesture near the right edge. Use a slower branch bend under the smaller leaf motion. Include short rests and uneven gust strength instead of one uniform sine loop.
2. **Pointer input:** feed smoothed pointer velocity into a bounded gust. A sweep should bend nearby foliage in the sweep direction after a short lag. The response should spread over a broad region, rather than produce a round cursor spotlight. Do not change the neutral surface color.
3. **Release:** let the gust decay over about 1.2–1.8 seconds. A slight counter-motion can make the branch feel flexible. Return to the ongoing idle phase without restarting it. Ignore pointer motion over DialKit, so tuning the effect does not repeatedly excite it.
4. **Secondary light:** allow the existing caustic folds to stretch or brighten slightly with the same gust, with a delayed and smaller response. The crescent should remain localized. Avoid a full-page liquid ripple.
5. **Reduced motion and touch:** retain a settled composition for reduced motion. On touch devices, keep the ambient breeze without coupling it to scrolling or requiring a hidden gesture.

Initial success check: at normal page size, an observer should notice foliage moving within three seconds, see a clear but restrained response to one pointer sweep, then see it settle. The text must remain stationary and easy to read. This needs a timed visual review, not only a frame counter or shader validation.

This is a proposal, not a verified implementation or performance claim. The research team should supply external reference links separately.
