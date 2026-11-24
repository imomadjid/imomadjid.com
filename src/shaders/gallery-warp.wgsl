// The See more tile's 4x4 grid of photos, zoomed by a radial profile so the middle can lead the
// edges. src/lib/gallery-warp.ts computes the profile on the CPU; this shader only looks it up.
import { ringScale, roundedBox } from "./rings.wgsl";

struct WarpParams {
  // Tile size in CSS pixels, and device pixels per CSS pixel.
  size: vec2f,
  dpr: f32,
  // Grid gap and cell corner radius at 1x, in CSS pixels.
  gap: f32,
  cellRadius: f32,
  // The tile's own corner radius, in CSS pixels on screen.
  tileRadius: f32,
  // Edge length of each square photo layer, in texels at mip 0.
  texSize: f32,
  mipCount: f32,
  // Grid pixels per screen pixel at RING_COUNT radii, from src/lib/ring-motion.ts.
  rings: array<vec4f, 12>,
}
@group(0) @binding(0) var<uniform> params: WarpParams;
@group(0) @binding(1) var photos: texture_2d_array<f32>;
@group(0) @binding(2) var photoSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = params.size;
  // Screen position from the tile's middle, in CSS pixels.
  let screen = (uv - 0.5) * size;
  let radius = length(screen) / length(size * 0.5);
  let scale = ringScale(params.rings, radius);
  // Device pixels per grid pixel, for antialiasing and mip selection.
  let pixelsPerGrid = params.dpr / scale;

  // The grid fills the tile at 1x. Cells split at the middle of each gap, so a cell's own edge
  // decides the pixels on both sides of it.
  let grid = screen * scale + size * 0.5;
  let cell = (size.x - 3.0 * params.gap) / 4.0;
  let pitch = cell + params.gap;
  let index = clamp(floor((grid + params.gap * 0.5) / pitch), vec2f(0.0), vec2f(3.0));
  let local = grid - index * pitch;
  let cellDistance = roundedBox(local - cell * 0.5, vec2f(cell * 0.5), params.cellRadius);
  let cellCoverage = clamp(0.5 - cellDistance * pixelsPerGrid, 0.0, 1.0);

  let tileDistance = roundedBox(screen, size * 0.5, params.tileRadius);
  let tileCoverage = clamp(0.5 - tileDistance * params.dpr, 0.0, 1.0);

  let layer = u32(index.y) * 4u + u32(index.x);
  let photoUv = clamp(local / cell, vec2f(0.0), vec2f(1.0));
  let texelsPerPixel = params.texSize / (cell * pixelsPerGrid);
  let level = clamp(log2(max(texelsPerPixel, 1e-4)), 0.0, params.mipCount - 1.0);
  let color = textureSampleLevel(photos, photoSampler, photoUv, layer, level).rgb;

  let alpha = cellCoverage * tileCoverage;
  return vec4f(color * alpha, alpha);
}
