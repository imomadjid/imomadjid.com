// Shared by the gallery shaders. Must match RING_COUNT in src/lib/ring-motion.ts.
export const RING_COUNT = 48u;

// Content pixels per screen pixel at a normalized radius (0 in the middle, 1 at a corner),
// interpolated from RING_COUNT samples packed four to a vec4.
export fn ringScale(rings: array<vec4f, 12>, radius: f32) -> f32 {
  let x = clamp(radius, 0.0, 1.0) * f32(RING_COUNT - 1u);
  let i = min(u32(floor(x)), RING_COUNT - 1u);
  let j = min(i + 1u, RING_COUNT - 1u);
  return mix(rings[i / 4u][i % 4u], rings[j / 4u][j % 4u], fract(x));
}

// Signed distance to a box with rounded corners, centred on the origin.
export fn roundedBox(p: vec2f, halfSize: vec2f, radius: f32) -> f32 {
  let q = abs(p) - halfSize + radius;
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - radius;
}
