// Live glass, first pass: the backdrop behind the glass (photos over a flat colour) drawn into an
// offscreen texture that covers the glass and as far around it as the frost reaches. The blur
// passes (live-glass-blur.wgsl) soften it, and live-glass.wgsl bends and tones it.
import { roundedBox } from "./rings.wgsl";

struct ComposeParams {
  // The texture's top left in the viewport, and the size it covers, in CSS pixels.
  origin: vec2f,
  span: vec2f,
  // CSS pixels per texel, for the photos' antialiased edges, and how many photos are listed.
  texel: f32,
  count: f32,
  // Edge length of each photo layer in texels.
  layerSize: f32,
  _pad: f32,
  // The viewport in CSS pixels: past its edges the frost sees the edge repeated, as iOS's does,
  // not content scrolled out of view.
  viewport: vec2f,
  _pad2: vec2f,
  // Flat colour behind the photos (sRGB).
  background: vec4f,
  // Photo i's box in the viewport (CSS pixels), the part of its layer the box shows (origin,
  // size), and its corner radius and layer.
  rects: array<vec4f, 8>,
  crops: array<vec4f, 8>,
  styles: array<vec4f, 8>,
}
@group(0) @binding(0) var<uniform> params: ComposeParams;
@group(0) @binding(1) var photos: texture_2d_array<f32>;
@group(0) @binding(2) var photoSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let q = clamp(params.origin + uv * params.span, vec2f(0.5), params.viewport - 0.5);
  var color = params.background.rgb;
  let count = u32(params.count);
  for (var i = 0u; i < 8u; i++) {
    if (i >= count) {
      break;
    }
    let rect = params.rects[i];
    let half = rect.zw * 0.5;
    let coverage = clamp(
      0.5 - roundedBox(q - rect.xy - half, half, params.styles[i].x) / params.texel, 0.0, 1.0
    );
    let crop = params.crops[i];
    let texel = crop.xy + (q - rect.xy) / rect.zw * crop.zw;
    // Mips as soft as one texel here, picked from sizes: derivatives aren't usable in the loop.
    let density = max(crop.z * params.layerSize / rect.z, crop.w * params.layerSize / rect.w);
    let lod = log2(max(density * params.texel, 1.0));
    let sampled = textureSampleLevel(photos, photoSampler, texel, i32(params.styles[i].y), lod);
    color = mix(color, sampled.rgb, coverage);
  }
  return vec4f(color, 1.0);
}
