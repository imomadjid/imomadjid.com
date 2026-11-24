// Live glass: one direction of a separable Gaussian over the composed backdrop. Run across, then
// down, at each of the frost's two scales.

struct BlurParams {
  // One texel's step along the blur, in texture coordinates.
  step: vec2f,
  // Standard deviation in texels.
  sigma: f32,
  _pad: f32,
}
@group(0) @binding(0) var<uniform> params: BlurParams;
@group(0) @binding(1) var source: texture_2d<f32>;
@group(0) @binding(2) var sourceSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  if (params.sigma < 0.1) {
    return textureSampleLevel(source, sourceSampler, uv, 0.0);
  }
  let reach = min(i32(ceil(3.0 * params.sigma)), 96);
  var sum = vec4f(0.0);
  var weights = 0.0;
  for (var k = -reach; k <= reach; k++) {
    let x = f32(k);
    let w = exp(-0.5 * x * x / (params.sigma * params.sigma));
    sum += w * textureSampleLevel(source, sourceSampler, uv + x * params.step, 0.0);
    weights += w;
  }
  return sum / weights;
}
