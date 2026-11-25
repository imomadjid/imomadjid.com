// A photo flying between its tile and the full-screen view, drawn as a quad whose four corners
// move one at a time (src/lib/gallery-flight.ts). The whole viewport is one fullscreen pass;
// each pixel finds where it lies in the quad by inverting the bilinear map.
import { inverseBilinear, quadSize } from "./quad.wgsl";
import { roundedBox } from "./rings.wgsl";

struct FlightParams {
  // Viewport size in CSS pixels, and device pixels per CSS pixel.
  size: vec2f,
  dpr: f32,
  radius: f32,
  // Corner positions in CSS pixels: top left and top right, then bottom right and bottom left.
  topCorners: vec4f,
  bottomCorners: vec4f,
  // Each corner's texture coordinate, in the same order.
  topTexels: vec4f,
  bottomTexels: vec4f,
}
@group(0) @binding(0) var<uniform> params: FlightParams;
@group(0) @binding(1) var photo: texture_2d<f32>;
@group(0) @binding(2) var photoSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.size;
  let a = params.topCorners.xy;
  let b = params.topCorners.zw;
  let c = params.bottomCorners.xy;
  let d = params.bottomCorners.zw;
  let q = inverseBilinear(p, a, b, c, d);
  let top = mix(params.topTexels.xy, params.topTexels.zw, q.x);
  let bottom = mix(params.bottomTexels.zw, params.bottomTexels.xy, q.x);
  let texel = mix(top, bottom, q.y);
  // Sampled with derivatives, so a photo shrinking into its tile reads the mip chain and doesn't
  // shimmer. Outside the quad the clamp flattens them, which keeps the edges sharp.
  let color = textureSample(photo, photoSampler, clamp(texel, vec2f(0.0), vec2f(1.0))).rgb;
  // Rounded corners in the quad's own pixels.
  let size = quadSize(q, a, b, c, d);
  let local = (q - 0.5) * size;
  let edge = roundedBox(local, size * 0.5, min(params.radius, 0.5 * min(size.x, size.y)));
  let coverage = clamp(0.5 - edge * params.dpr, 0.0, 1.0);
  return vec4f(color * coverage, coverage);
}
