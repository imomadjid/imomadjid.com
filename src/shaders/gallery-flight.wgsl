// A photo flying between its tile and the full-screen view, drawn as a quad whose four corners
// move one at a time (src/lib/gallery-flight.ts). The whole viewport is one fullscreen pass;
// each pixel finds where it lies in the quad by inverting the bilinear map.
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

fn cross2(a: vec2f, b: vec2f) -> f32 {
  return a.x * b.y - a.y * b.x;
}

// Where p lies in the quad a (0,0), b (1,0), c (1,1), d (0,1); outside it gives values beyond 0..1.
// After Inigo Quilez, "Inverse bilinear interpolation".
fn inverseBilinear(p: vec2f, a: vec2f, b: vec2f, c: vec2f, d: vec2f) -> vec2f {
  let e = b - a;
  let f = d - a;
  let g = a - b + c - d;
  let h = p - a;
  let k2 = cross2(g, f);
  let k1 = cross2(e, f) + cross2(h, g);
  let k0 = cross2(h, e);
  if (abs(k2) < 1e-3) {
    // A parallelogram: the map is linear.
    return vec2f((h.x * k1 + f.x * k0) / (e.x * k1 - g.x * k0), -k0 / k1);
  }
  let w = k1 * k1 - 4.0 * k0 * k2;
  if (w < 0.0) {
    return vec2f(-1.0);
  }
  let root = sqrt(w);
  var v = (-k1 - root) * 0.5 / k2;
  var u = (h.x - f.x * v) / (e.x + g.x * v);
  if (u < 0.0 || u > 1.0 || v < 0.0 || v > 1.0) {
    v = (-k1 + root) * 0.5 / k2;
    u = (h.x - f.x * v) / (e.x + g.x * v);
  }
  return vec2f(u, v);
}

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
  let color = textureSampleLevel(photo, photoSampler, clamp(texel, vec2f(0.0), vec2f(1.0)), 0.0).rgb;
  // Rounded corners in the quad's own pixels: its width and height where this pixel sits.
  let width = mix(distance(a, b), distance(d, c), q.y);
  let height = mix(distance(a, d), distance(b, c), q.x);
  let local = (q - 0.5) * vec2f(width, height);
  let edge = roundedBox(local, vec2f(width, height) * 0.5, min(params.radius, 0.5 * min(width, height)));
  let coverage = clamp(0.5 - edge * params.dpr, 0.0, 1.0);
  return vec4f(color * coverage, coverage);
}
