// The See more tile's photos flying between its cells and the overlay's masonry, each drawn as a
// quad whose corners move on their own (src/lib/gallery-flight.ts), in one fullscreen pass. Later
// cells draw over earlier ones where they cross mid-flight.
import { inverseBilinear, quadSize } from "./quad.wgsl";
import { roundedBox } from "./rings.wgsl";

struct CellsFlightParams {
  // Viewport size in CSS pixels, and device pixels per CSS pixel.
  size: vec2f,
  dpr: f32,
  // How many cells to draw, at most 16.
  count: f32,
  // Edge length of each photo layer, in texels at mip 0.
  texSize: f32,
  mipCount: f32,
  // Cell i's corners in CSS pixels: corners[2i] holds top left and top right, corners[2i + 1]
  // bottom right and bottom left.
  corners: array<vec4f, 32>,
  // Each corner's texture coordinate in the same layout. A layer holds its whole photo squeezed
  // square, so these are the photo's own coordinates.
  texels: array<vec4f, 32>,
  // Cell i's corner radius in CSS pixels, then its opacity.
  styles: array<vec4f, 16>,
}
@group(0) @binding(0) var<uniform> params: CellsFlightParams;
@group(0) @binding(1) var photos: texture_2d_array<f32>;
@group(0) @binding(2) var photoSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.size;
  var color = vec4f(0.0);
  for (var i = 0u; i < u32(params.count); i += 1u) {
    let top = params.corners[2u * i];
    let bottom = params.corners[2u * i + 1u];
    let a = top.xy;
    let b = top.zw;
    let c = bottom.xy;
    let d = bottom.zw;
    // Skips the solve for pixels clear of the cell.
    let low = min(min(a, b), min(c, d)) - 1.0;
    let high = max(max(a, b), max(c, d)) + 1.0;
    if (any(p < low) || any(p > high)) {
      continue;
    }
    let q = inverseBilinear(p, a, b, c, d);
    let size = quadSize(q, a, b, c, d);
    let style = params.styles[i];
    let radius = min(style.x, 0.5 * min(size.x, size.y));
    let edge = roundedBox((q - 0.5) * size, size * 0.5, radius);
    let coverage = clamp(0.5 - edge * params.dpr, 0.0, 1.0) * style.y;
    if (coverage <= 0.0) {
      continue;
    }

    let topTexels = params.texels[2u * i];
    let bottomTexels = params.texels[2u * i + 1u];
    let texel = mix(
      mix(topTexels.xy, topTexels.zw, q.x),
      mix(bottomTexels.zw, bottomTexels.xy, q.x),
      q.y,
    );
    // The mip follows how many texels each device pixel spans. Derivatives aren't usable inside
    // the loop, so it comes from the cell's size on screen against its span of the layer, averaged
    // across the axes: squeezing a photo square stretches one of them.
    let span = quadSize(q, topTexels.xy, topTexels.zw, bottomTexels.xy, bottomTexels.zw)
      * params.texSize;
    let pixels = max(size * params.dpr, vec2f(1e-4));
    let texelsPerPixel = sqrt((span.x / pixels.x) * (span.y / pixels.y));
    let level = clamp(log2(max(texelsPerPixel, 1e-4)), 0.0, params.mipCount - 1.0);
    let rgb = textureSampleLevel(photos, photoSampler, clamp(texel, vec2f(0.0), vec2f(1.0)), i, level).rgb;
    color = vec4f(rgb * coverage, coverage) + color * (1.0 - coverage);
  }
  return color;
}
