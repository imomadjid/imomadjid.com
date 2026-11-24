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
  // The See more tile's box and corner radius, in CSS pixels. Each cell is clipped to it grown by
  // its own margin, so cells the tile's 2x crop leaves out slide behind its edge as they land.
  clipRadius: f32,
  clip: vec4f,
  // Cell i's corners in CSS pixels: corners[2i] holds top left and top right, corners[2i + 1]
  // bottom right and bottom left.
  corners: array<vec4f, 32>,
  // Each corner's texture coordinate in the same layout. A layer holds its whole photo squeezed
  // square, so these are the photo's own coordinates.
  texels: array<vec4f, 32>,
  // Cell i's corner radius in CSS pixels, its opacity, its clip margin, then how far it has
  // turned into the photo it becomes.
  styles: array<vec4f, 16>,
  // Cell i's layer, the layer of the photo it becomes, and that photo's aspect.
  layers: array<vec4f, 16>,
}
@group(0) @binding(0) var<uniform> params: CellsFlightParams;
@group(0) @binding(1) var photos: texture_2d_array<f32>;
@group(0) @binding(2) var photoSampler: sampler;

// The mip for a cell spanning `span` texels of its layer across `pixels` device pixels, averaged
// across the axes: squeezing a photo square stretches one of them. Derivatives aren't usable
// inside the cell loop, so it comes from sizes instead.
fn mipLevel(span: vec2f, pixels: vec2f) -> f32 {
  let texelsPerPixel = sqrt((span.x / pixels.x) * (span.y / pixels.y));
  return clamp(log2(max(texelsPerPixel, 1e-4)), 0.0, params.mipCount - 1.0);
}

// The part of a photo of `imageAspect`, in 0 to 1 coordinates, that object-fit: cover shows in a
// box of `boxAspect`: its origin, then its size.
fn coverCrop(imageAspect: f32, boxAspect: f32) -> vec4f {
  if (imageAspect > boxAspect) {
    let width = boxAspect / imageAspect;
    return vec4f((1.0 - width) * 0.5, 0.0, width, 1.0);
  }
  let height = imageAspect / boxAspect;
  return vec4f(0.0, (1.0 - height) * 0.5, 1.0, height);
}

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
    let clipHalf = params.clip.zw * 0.5 + style.z;
    let clipEdge = roundedBox(
      p - params.clip.xy - params.clip.zw * 0.5,
      clipHalf,
      min(params.clipRadius + style.z, min(clipHalf.x, clipHalf.y)),
    );
    let coverage = clamp(0.5 - edge * params.dpr, 0.0, 1.0)
      * clamp(0.5 - clipEdge * params.dpr, 0.0, 1.0) * style.y;
    if (coverage <= 0.0) {
      continue;
    }

    let layers = params.layers[i];
    let topTexels = params.texels[2u * i];
    let bottomTexels = params.texels[2u * i + 1u];
    let texel = mix(
      mix(topTexels.xy, topTexels.zw, q.x),
      mix(bottomTexels.zw, bottomTexels.xy, q.x),
      q.y,
    );
    // The mip follows how many texels each device pixel spans.
    let span = quadSize(q, topTexels.xy, topTexels.zw, bottomTexels.xy, bottomTexels.zw)
      * params.texSize;
    let pixels = max(size * params.dpr, vec2f(1e-4));
    var rgb = textureSampleLevel(
      photos,
      photoSampler,
      clamp(texel, vec2f(0.0), vec2f(1.0)),
      u32(layers.x),
      mipLevel(span, pixels),
    ).rgb;
    // Crossfades into the photo it becomes, cropped to the cell's shape now as object-fit: cover
    // would crop it, over the middle of the flight, so the double exposure is brief.
    if (layers.y != layers.x && style.w > 0.0) {
      let crop = coverCrop(layers.z, size.x / max(size.y, 1e-4));
      let turned = textureSampleLevel(
        photos,
        photoSampler,
        crop.xy + q * crop.zw,
        u32(layers.y),
        mipLevel(crop.zw * params.texSize, pixels),
      ).rgb;
      rgb = mix(rgb, turned, smoothstep(0.2, 0.8, style.w));
    }
    color = vec4f(rgb * coverage, coverage) + color * (1.0 - coverage);
  }
  return color;
}
