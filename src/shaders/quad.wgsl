// Quads whose corners move on their own (the Gallery's flights): where a pixel lies in one, and
// how large the quad is around it.

export fn cross2(a: vec2f, b: vec2f) -> f32 {
  return a.x * b.y - a.y * b.x;
}

// u for a given v: solves h = u (e + g v) + f v along the axis with the larger denominator.
export fn solveU(h: vec2f, e: vec2f, f: vec2f, g: vec2f, v: f32) -> f32 {
  let across = e + g * v;
  let rest = h - f * v;
  if (abs(across.x) >= abs(across.y)) {
    return rest.x / select(across.x, 1.0, across.x == 0.0);
  }
  return rest.y / across.y;
}

export fn inside01(q: vec2f) -> bool {
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
export fn inverseBilinear(p: vec2f, a: vec2f, b: vec2f, c: vec2f, d: vec2f) -> vec2f {
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

// The quad's own width and height at q: its top and bottom edges' lengths mixed down, its left and
// right edges' mixed across, so rounded corners and grid gaps keep their size as it warps.
export fn quadSize(q: vec2f, a: vec2f, b: vec2f, c: vec2f, d: vec2f) -> vec2f {
  return vec2f(mix(distance(a, b), distance(d, c), q.y), mix(distance(a, d), distance(b, c), q.x));
}
