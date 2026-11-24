// Live liquid glass, last pass: the glass shape over its backdrop, refracted, frosted and toned as
// iOS 27's .glassEffect(.regular) draws it. tools/glass-live/fit.py fits the model to simulator
// captures and evaluates it the same way (except the 1-device-pixel edge antialiasing and the
// shadow's overlay form); src/lib/live-glass.ts runs the passes:
//   sample = p - n * pull(d)            inside, d pt in from the edge, n its outward normal
//   base   = mix(narrow, wide, wide) at sample   the backdrop at the frost's two blurs
//   base   = luma + saturation * (base - luma)
//   out    = offset + gain * base + curve * base^2   from the material table at (d, normal)
// Outside the shape the table holds the drop shadow and hairline: their tone of the backdrop is
// drawn as a black or white overlay, so the page shows through as it is.
import { roundedBox } from "./rings.wgsl";

struct GlassParams {
  // Canvas size in CSS pixels, device pixels per CSS pixel, and the material table's layer
  // (0 light, 1 dark).
  size: vec2f,
  dpr: f32,
  scheme: f32,
  // The canvas's top left in the viewport, in CSS pixels, and screen pixels per canvas CSS pixel
  // (not 1 while a transform scales the glass).
  origin: vec2f,
  zoom: vec2f,
  // The shape's scale against the fitted 56 pt circle, which narrows the refraction on smaller
  // shapes, and its corner radius in CSS pixels.
  scale: f32,
  radius: f32,
  // The glass shape in canvas CSS pixels: x, y, width, height.
  box: vec4f,
  // The blurred backdrops' top left in the viewport and the size they cover, CSS pixels.
  region: vec4f,
  wide: f32,
  saturation: f32,
  // Material table rows: d of the first row in pt, pt per row; then the row and angle counts.
  tableMin: f32,
  tableStep: f32,
  tableRows: f32,
  tableAngles: f32,
  // The bevel's pull, pt inward, at 10 distances from the edge in pt (the last 0), and its slope
  // there, four a slot.
  knots: array<vec4f, 3>,
  pulls: array<vec4f, 3>,
  slopes: array<vec4f, 3>,
}
@group(0) @binding(0) var<uniform> params: GlassParams;
@group(0) @binding(1) var narrow: texture_2d<f32>;
@group(0) @binding(2) var wideBlur: texture_2d<f32>;
@group(0) @binding(3) var backdropSampler: sampler;
@group(0) @binding(4) var material: texture_2d_array<f32>;
@group(0) @binding(5) var materialSampler: sampler;

fn shape(p: vec2f) -> f32 {
  let half = params.box.zw * 0.5;
  return roundedBox(p - params.box.xy - half, half, params.radius);
}

fn knot(i: u32) -> f32 {
  return params.knots[i / 4u][i % 4u];
}

fn pullAt(i: u32) -> f32 {
  return params.pulls[i / 4u][i % 4u];
}

fn slopeAt(i: u32) -> f32 {
  return params.slopes[i / 4u][i % 4u];
}

// The pull at d pt from the edge: a cubic Hermite through the knots with fit.py's PCHIP slopes,
// so the magnification changes smoothly around the rim. 0 past the last knot.
fn pull(d: f32) -> f32 {
  if (d >= knot(9u)) {
    return 0.0;
  }
  for (var i = 1u; i < 10u; i++) {
    if (d <= knot(i)) {
      let h = knot(i) - knot(i - 1u);
      let t = clamp((d - knot(i - 1u)) / h, 0.0, 1.0);
      let t2 = t * t;
      let t3 = t2 * t;
      return (2.0 * t3 - 3.0 * t2 + 1.0) * pullAt(i - 1u) + (t3 - 2.0 * t2 + t) * h * slopeAt(i - 1u)
        + (-2.0 * t3 + 3.0 * t2) * pullAt(i) + (t3 - t2) * h * slopeAt(i);
    }
  }
  return 0.0;
}

// Offset, gain and curve at d pt in from the edge (negative outside) and the normal's angle.
fn materialAt(d: f32, normal: vec2f) -> vec3f {
  let angle = atan2(normal.y, normal.x);
  let u = ((angle + 3.14159265) / 6.28318531 * params.tableAngles + 0.5) / params.tableAngles;
  let row = clamp((d - params.tableMin) / params.tableStep, 0.0, params.tableRows - 1.0);
  let v = (row + 0.5) / params.tableRows;
  return textureSampleLevel(material, materialSampler, vec2f(u, v), i32(params.scheme), 0.0).rgb;
}

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.size;
  let sd = shape(p);
  let e = 0.25;
  let normal = normalize(
    vec2f(shape(p + vec2f(e, 0.0)) - shape(p - vec2f(e, 0.0)),
          shape(p + vec2f(0.0, e)) - shape(p - vec2f(0.0, e))) + vec2f(1e-6, 0.0)
  );
  // The rim keeps its width in pt at any size, as iOS draws it.
  let d = -sd;
  let m = materialAt(d, normal);
  let dither = (hash(p * params.dpr) - 0.5) / 255.0;

  // Outside: the shadow and hairline over the page, which shows through. The material's tone of
  // the backdrop here is drawn as black (darker) or white (lighter) at the alpha that reaches it
  // over that backdrop.
  let under = dot(
    textureSampleLevel(
      narrow, backdropSampler, (params.origin + p * params.zoom - params.region.xy) / params.region.zw, 0.0
    ).rgb,
    vec3f(0.2126, 0.7152, 0.0722)
  );
  let toned = clamp(m.x + m.y * under + m.z * under * under + dither, 0.0, 1.0);
  var outside = vec4f(0.0, 0.0, 0.0, clamp(1.0 - toned / max(under, 1e-3), 0.0, 1.0));
  if (toned > under) {
    let a = clamp((toned - under) / max(1.0 - under, 1e-3), 0.0, 1.0);
    outside = vec4f(a, a, a, a);
  }
  if (sd > 1.0) {
    return outside;
  }

  let scale = params.scale;
  let q = params.origin + (p - normal * pull(d / scale) * scale) * params.zoom;
  let at = (q - params.region.xy) / params.region.zw;
  var base = mix(
    textureSampleLevel(narrow, backdropSampler, at, 0.0).rgb,
    textureSampleLevel(wideBlur, backdropSampler, at, 0.0).rgb,
    params.wide
  );
  let luma = dot(base, vec3f(0.2126, 0.7152, 0.0722));
  // Unclamped, as fit.py fits it: a saturated channel may leave 0-1 before the tone.
  base = vec3f(luma) + params.saturation * (base - vec3f(luma));
  let glass = clamp(m.x + m.y * base + m.z * base * base + dither, vec3f(0.0), vec3f(1.0));
  // Antialiased edge between the glass and its shadow, over one device pixel.
  let coverage = clamp(0.5 - sd * params.dpr, 0.0, 1.0);
  return mix(outside, vec4f(glass, 1.0), coverage);
}
