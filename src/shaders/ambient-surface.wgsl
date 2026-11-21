struct SurfaceParams {
  surfaceColor: vec3f,
  night: f32,
  intensity: f32,
  warmth: f32,
  direction: f32,
  entranceDawn: f32,
  entranceDusk: f32,
}
@group(0) @binding(0) var<uniform> params: SurfaceParams;
@group(0) @binding(1) var lighting: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;

fn srgbToLinear(c: vec3f) -> vec3f {
  return select(c / 12.92, pow((c + 0.055) / 1.055, vec3f(2.4)), c > vec3f(0.04045));
}
fn linearToSrgb(c: vec3f) -> vec3f {
  return select(c * 12.92, 1.055 * pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.4)) - 0.055, c > vec3f(0.0031308));
}
@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let n = params.night;
  let surface = srgbToLinear(params.surfaceColor);
  let sunset = srgbToLinear(mix(vec3f(0.70, 0.77, 0.85), vec3f(0.96, 0.59, 0.29), params.direction * params.warmth));
  // The warm pass peaks early in the change, while the surface is still bright enough to carry it.
  let glowWindow = smoothstep(0.0, 0.3, n) * (1.0 - smoothstep(0.3, 0.85, n));
  let lightingSample = textureSampleLevel(lighting, linearSampler, uv, 0.0).rg;
  let light = lightingSample.r;
  let directEnergy = lightingSample.g * params.intensity * mix(0.72, 0.62, n);
  // Exposure-normalize direct + diffuse fill to preserve the site's surface token.
  // Where the emitter contributes little, fill dominates and shadows disappear.
  let directShare = directEnergy / (1.0 + directEnergy);
  // Warm the incoming light, not the entire receiving surface.
  let sunExposure = light * lightingSample.g;
  let tint = min(1.0, 2.0 * params.warmth * params.intensity * sunExposure * (1.0 - n));
  let daylight = surface * mix(vec3f(1.0), vec3f(1.0, 0.962, 0.865), tint);
  // Add the low sun as light: it can warm and brighten lit patches but never darken a channel.
  let surfaceLuminance = dot(surface, vec3f(0.2126, 0.7152, 0.0722));
  let material = daylight + sunset * surfaceLuminance * glowWindow * sunExposure * params.intensity * 2.0;
  let illumination = 1.0 - directShare * (1.0 - light);
  // Entrance grading is independent of theme interpolation. Dawn stays light;
  // dusk adds a localized warm beam to the already-dark receiving surface.
  let coolGradient = 0.35 + 0.65 * (1.0 - smoothstep(0.0, 1.0, uv.y));
  let dawnSurface = material * mix(vec3f(1.0), vec3f(0.78, 0.87, 1.0), params.entranceDawn * coolGradient);
  let dawnGold = 4.0 * params.entranceDawn * (1.0 - params.entranceDawn);
  let entranceGold = (dawnGold * 0.10 + params.entranceDusk * 0.16)
    * sunExposure * params.intensity;
  let graded = mix(dawnSurface, srgbToLinear(vec3f(0.96, 0.59, 0.29)), entranceGold);
  // A small direct moonlight contribution makes canopy occlusion readable on
  // the dark material. Visibility still comes from the traced light rays.
  let moonlight = vec3f(0.63, 0.76, 1.0) * (0.0175 * n * n * params.intensity * sunExposure);
  // Shade keeps the cooler skylight fill, so lit and shaded areas differ in hue as well as level.
  let shade = directShare * (1.0 - light);
  let skyFill = mix(vec3f(1.0), vec3f(0.89, 0.94, 1.0), clamp(params.warmth * (1.0 - n) * shade * 3.0, 0.0, 1.0));
  let color = graded * illumination * skyFill + moonlight;
  return vec4f(clamp(linearToSrgb(color), vec3f(0.0), vec3f(1.0)), 1.0);
}
