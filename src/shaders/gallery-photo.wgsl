// One featured Gallery photo, cropped to its tile like object-fit: cover and zoomed by a radial
// profile, so the middle leads the edges. src/lib/gallery-photo-zoom.ts computes the profile.
import { ringScale, roundedBox } from "./rings.wgsl";

struct PhotoParams {
  // Tile size in CSS pixels, and device pixels per CSS pixel.
  size: vec2f,
  dpr: f32,
  // The tile's corner radius, in CSS pixels.
  radius: f32,
  // The part of the photo the tile shows at rest, in texture coordinates: origin, then size.
  crop: vec4f,
  // Photo pixels per screen pixel at RING_COUNT radii, from src/lib/ring-motion.ts.
  rings: array<vec4f, 12>,
}
@group(0) @binding(0) var<uniform> params: PhotoParams;
@group(0) @binding(1) var photo: texture_2d<f32>;
@group(0) @binding(2) var photoSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = params.size;
  let screen = (uv - 0.5) * size;
  let scale = ringScale(params.rings, length(screen) / length(size * 0.5));
  // Zooming in shows less of the photo around the same middle.
  let tile = screen * scale / size + 0.5;
  let texel = params.crop.xy + tile * params.crop.zw;
  let color = textureSample(photo, photoSampler, texel).rgb;
  let coverage = clamp(0.5 - roundedBox(screen, size * 0.5, params.radius) * params.dpr, 0.0, 1.0);
  return vec4f(color * coverage, coverage);
}
