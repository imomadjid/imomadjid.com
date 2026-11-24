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

// u for a given v: solves h = u (e + g v) + f v along the axis with the larger denominator.
fn solveU(h: vec2f, e: vec2f, f: vec2f, g: vec2f, v: f32) -> f32 {
  let across = e + g * v;
  let rest = h - f * v;
  if (abs(across.x) >= abs(across.y)) {
    return rest.x / select(across.x, 1.0, across.x == 0.0);
  }
  return rest.y / across.y;
}

fn inside01(q: vec2f) -> bool {
  return all(q >= vec2f(0.0)) && all(q <= vec2f(1.0));
}

// Where p lies in the quad a (0,0), b (1,0), c (1,1), d (0,1); outside it gives values beyond 0..1.
// After Inigo Quilez, "Inverse bilinear interpolation".
//
// v solves k2 v² + k1 v + k0 = 0. The textbook roots, (-k1 ± √w) / 2 k2, subtract two nearly equal
// numbers when the quad is nearly a parallelogram (k2 → 0), and in f32 that leaves v off by whole
// bands of the photo. A landed rect is one: a - b + c - d rounds to about 1e-4 px rather than 0, so
// k2 lands just above any cut-off, and the landed frame drew the photo in smeared horizontal bands.
// The stable form below never subtracts them, and tends to the linear map -k0 / k1 as k2 → 0.
fn inverseBilinear(p: vec2f, a: vec2f, b: vec2f, c: vec2f, d: vec2f) -> vec2f {
  let e = b - a;
  let f = d - a;
  let g = a - b + c - d;
  let h = p - a;
  let k2 = cross2(g, f);
  let k1 = cross2(e, f) + cross2(h, g);
  let k0 = cross2(h, e);
  let w = k1 * k1 - 4.0 * k0 * k2;
  if (w < 0.0) {
    return vec2f(-1.0);
  }
  let q = -0.5 * (k1 + select(-1.0, 1.0, k1 >= 0.0) * sqrt(w));
  if (q == 0.0) {
    return vec2f(-1.0);
  }
  // The root that stays finite as the quad becomes a parallelogram, then the other one.
  let near = k0 / q;
  let first = vec2f(solveU(h, e, f, g, near), near);
  if (inside01(first) || k2 == 0.0) {
    return first;
  }
  let far = q / k2;
  let second = vec2f(solveU(h, e, f, g, far), far);
  return select(first, second, inside01(second));
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
  // Sampled with derivatives, so a photo shrinking into its tile reads the mip chain and doesn't
  // shimmer. Outside the quad the clamp flattens them, which keeps the edges sharp.
  let color = textureSample(photo, photoSampler, clamp(texel, vec2f(0.0), vec2f(1.0))).rgb;
  // Rounded corners in the quad's own pixels: its width and height where this pixel sits.
  let width = mix(distance(a, b), distance(d, c), q.y);
  let height = mix(distance(a, d), distance(b, c), q.x);
  let local = (q - 0.5) * vec2f(width, height);
  let edge = roundedBox(local, vec2f(width, height) * 0.5, min(params.radius, 0.5 * min(width, height)));
  let coverage = clamp(0.5 - edge * params.dpr, 0.0, 1.0);
  return vec4f(color * coverage, coverage);
}
