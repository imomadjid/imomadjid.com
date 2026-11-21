struct Params {
  time: f32,
  night: f32,
  aspect: f32,
  angle: f32,
  softness: f32,
  progressiveSoftness: f32,
  opening: f32,
  spacing: f32,
  railWidth: f32,
  blindDepth: f32,
  movement: f32,
  density: f32,
  casterDepth: f32,
  foliageScale: f32,
  pointerX: f32,
  pointerY: f32,
  breezeX: f32,
  breezeY: f32,
  aimX: f32,
  aimY: f32,
  beamWidth: f32,
  railX: f32,
  wandX: f32,
  wandY: f32,
  wandAngle: f32,
  wandDepth: f32,
  wandTipStart: f32,
  wandTipEnd: f32,
  wandTipWidth: f32,
  wandLength: f32,
  wandRadius: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var foliage: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;

// World units are relative to the visible wall height. The receiver is z = 0.
// A finite disk emitter illuminates a tilted blind assembly and two alpha-masked
// foliage planes. Each sample follows one segment through all three occluders.
fn planeHit(origin: vec3f, ray: vec3f, point: vec3f, normal: vec3f) -> vec3f {
  let t = dot(point - origin, normal) / dot(ray, normal);
  return origin + ray * t;
}

// Gust strength rises and falls on slow, incommensurate cycles with short lulls between gusts,
// and arrives at different parts of the canopy at different times.
fn gust(p: vec2f, t: f32) -> f32 {
  let swell = 0.6 * sin(t * 0.31 - p.x * 0.8) + 0.4 * sin(t * 0.53 + 1.7 - p.y * 0.6);
  return 0.3 + 0.7 * smoothstep(-0.4, 0.7, swell);
}

fn wind(p: vec2f, t: f32) -> vec2f {
  let strength = gust(p, t);
  // Delay the main sway along the wind direction so branches do not move as one sheet.
  let travel = p.x * 1.3 + p.y * 0.4;
  let flutter = 0.5 + 0.5 * strength;
  return vec2f(
    strength * sin(p.y * 2.3 - travel + t * 1.05) + 0.22 * flutter * sin(p.x * 9.1 - t * 2.4),
    0.5 * strength * cos(p.x * 2.7 - travel + t * 0.83) + 0.15 * flutter * sin(p.y * 8.3 + t * 2.1)
  );
}

fn leafCoverage(uv: vec2f, lod: f32) -> f32 {
  let inside = all(uv >= vec2f(0.0)) && all(uv <= vec2f(1.0));
  return textureSampleLevel(foliage, linearSampler, uv, lod).r * select(0.0, 1.0, inside);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let wall = vec3f((uv.x - 1.0) * params.aspect, uv.y, 0.0);
  let lightAngle = (params.angle + params.night * 42.0) * 0.0174533;
  let source = vec3f(2.6, tan(lightAngle) * 5.0, 5.0);
  let aim = vec3f((params.aimX - 1.0) * params.aspect, params.aimY, 0.0);
  // Art-directed receiver-dependent emitter size: preserve a clear focal area,
  // then broaden the actual shadow-ray footprint progressively away from it.
  let focusDistance = length(wall.xy - aim.xy);
  let defocus = smoothstep(0.12, 0.9, focusDistance);
  let sourceRadius = params.softness * 0.14 * (1.0 + params.progressiveSoftness * defocus);
  // Keep the canopy legible: only a quarter of the artistic defocus applies
  // to foliage. Its central light direction and depth projection stay shared.
  let foliageRadius = params.softness * mix(0.14, 0.055, params.night)
    * (1.0 + params.progressiveSoftness * defocus * 0.25);
  let beamAxis = normalize(aim - source);
  let beamRight = normalize(cross(beamAxis, vec3f(0.0, 1.0, 0.0)));
  let beamUp = cross(beamRight, beamAxis);
  // An elongated angular emission lobe, shared by all emitter samples.
  // Scale its angular width to frame the wall across viewport sizes.
  let beamSpread = vec2f(params.aspect * params.beamWidth, 1.5) / length(aim - source);
  let referenceRay = source - vec3f(0.0, 0.45, 0.0);
  let referenceEnergy = normalize(referenceRay).z / dot(referenceRay, referenceRay);
  let blindOrigin = vec3f(0.0, 0.0, params.blindDepth);
  let blindNormal = normalize(vec3f(0.342, 0.0, 0.94));
  let blindAxis = normalize(vec3f(0.94, 0.0, -0.342));
  // Enlarge both canopy planes around their attached branch, not their top-left
  // texture corner. Their depth stays fixed, preserving light-driven parallax.
  let canopyScale = 2.0 * params.foliageScale;
  let branchAnchor = vec2f(1.0, 0.95);
  let nearOffset = branchAnchor * 0.932 * (1.0 - canopyScale);
  let farOffset = branchAnchor * 0.85 * (1.0 - canopyScale);
  let nearOrigin = vec3f(vec2f(-0.352, -0.625) + nearOffset, 0.85 + params.casterDepth * 0.5);
  // A lower, farther branch catches moonlight. Keep it fixed in world space
  // so its shadow enters and leaves the wall naturally as the source moves.
  let farOrigin = vec3f(vec2f(0.210, 0.22) + farOffset, 1.55 + params.casterDepth * 0.65);
  let nearSize = 0.932 * canopyScale;
  let farSize = 0.85 * canopyScale;
  let nearLod = clamp(log2(max(1.0, nearOrigin.z / source.z * foliageRadius / nearSize * 1024.0 / sqrt(32.0))), 0.0, 4.0);
  let farLod = clamp(log2(max(1.0, farOrigin.z / source.z * foliageRadius / farSize * 1024.0 / sqrt(32.0))), 0.0, 4.0);
  let planeNormal = vec3f(0.0, 0.0, 1.0);
  let centerRay = source - wall;
  let nearCenter = (planeHit(wall, centerRay, nearOrigin, planeNormal).xy - nearOrigin.xy) / nearSize;
  let farCenter = (planeHit(wall, centerRay, farOrigin, planeNormal).xy - farOrigin.xy) / farSize;
  // Measure anchor falloff before texture scaling. Enlarging the canopy must
  // not expand its pinned region across the visible branches.
  let nearAnchor = smoothstep(0.0, 0.8, length(nearCenter - branchAnchor) * canopyScale);
  let farAnchor = smoothstep(0.0, 0.8, length(farCenter - branchAnchor) * canopyScale);
  let pointerDistance = length((uv - vec2f(params.pointerX, params.pointerY)) * vec2f(params.aspect, 1.0));
  let influence = 1.0 - smoothstep(0.05, 0.55, pointerDistance);
  let gust = vec2f(params.breezeX, params.breezeY) * influence;
  // Larger branches get a modest increase in wind travel; pointer gusts keep
  // their original world-space displacement.
  let windScale = sqrt(canopyScale);
  let nearWind = (wind(nearCenter, params.time) * (0.032 * params.movement) / windScale + gust / canopyScale) * nearAnchor;
  let farWind = (wind(farCenter + vec2f(0.7, 1.3), params.time * 0.79) * (0.021 * params.movement) / windScale + gust * 0.45 / canopyScale) * farAnchor;
  let centerBlind = planeHit(wall, centerRay, blindOrigin, blindNormal);
  let pixelWidth = max(fwidth(centerBlind.y), 0.0005);
  let railPixelWidth = max(fwidth(dot(centerBlind - blindOrigin, blindAxis)), 0.0005);
  // One vertical support on the same tilted plane as the slats, placed so its shadow falls at
  // railX. The rail runs parallel to the wall's y axis, so light height cannot move its shadow.
  let railWall = vec3f((params.railX - 1.0) * params.aspect, 0.0, 0.0);
  let railHit = planeHit(railWall, source - railWall, blindOrigin, blindNormal);
  let railPosition = dot(railHit - blindOrigin, blindAxis);
  let opening = mix(params.opening, params.opening * 0.5, params.night);
  // The tilt wand hangs from its pivot on a plane parallel to the wall. Its clear acrylic rod
  // and flat tip pass some light and focus a bright line down the middle of their shadow; the
  // wire hook above them is opaque.
  let wandOrigin = vec3f((params.wandX - 1.0) * params.aspect, params.wandY, params.wandDepth);
  let wandDown = vec2f(sin(params.wandAngle), cos(params.wandAngle));
  let wandAcross = vec2f(wandDown.y, -wandDown.x);
  let wandCenter = planeHit(wall, centerRay, wandOrigin, planeNormal).xy;
  let wandPixel = max(fwidth(wandCenter.x), 0.0005);
  var visibleEnergy = 0.0;
  var incidentEnergy = 0.0;
  // Stable disk quadrature: no random grain, temporal noise, or screen-space blur.
  for (var i = 0u; i < 32u; i += 1u) {
    let fi = f32(i);
    let theta = fi * 2.399963;
    let disk = vec2f(cos(theta), sin(theta)) * sqrt((fi + 0.5) / 32.0);
    let emitter = source + vec3f(disk * sourceRadius, 0.0);
    let ray = emitter - wall;
    let blindHit = planeHit(wall, ray, blindOrigin, blindNormal);
    let localBlind = blindHit - blindOrigin;
    let withinBlinds = abs(dot(localBlind, blindAxis)) < 2.5 && abs(localBlind.y - 0.5) < 2.0;
    let stripeDistance = abs(fract(localBlind.y / params.spacing) - 0.5) * params.spacing;
    let gap = opening * params.spacing * 0.5;
    let throughGap = 1.0 - smoothstep(gap - pixelWidth, gap + pixelWidth, stripeDistance);
    let railDistance = abs(dot(localBlind, blindAxis) - railPosition);
    let railCoverage = (1.0 - smoothstep(params.railWidth * 0.5 - railPixelWidth,
      params.railWidth * 0.5 + railPixelWidth, railDistance))
      * select(0.0, 1.0, params.railWidth > 0.0);
    let blindTransmission = select(1.0, throughGap * (1.0 - railCoverage), withinBlinds);
    let wandLocal = planeHit(wall, ray, wandOrigin, planeNormal).xy - wandOrigin.xy;
    let along = dot(wandLocal, wandDown);
    let across = abs(dot(wandLocal, wandAcross));
    let wandWidth = select(select(params.wandRadius * 0.2, params.wandTipWidth,
      along >= params.wandTipStart), params.wandRadius, along >= params.wandTipEnd);
    let wandCoverage = (1.0 - smoothstep(wandWidth - wandPixel, wandWidth + wandPixel, across))
      * select(0.0, 1.0, along > -0.5 && along < params.wandLength && params.wandRadius > 0.0);
    let acrylicOpacity = mix(0.18, 0.78, smoothstep(0.1, 0.85, across / max(wandWidth, 0.0001)));
    let wandTransmission = 1.0 - wandCoverage
      * select(1.0, acrylicOpacity, along >= params.wandTipStart);
    let foliageRay = source + vec3f(disk * foliageRadius, 0.0) - wall;
    let nearUv = (planeHit(wall, foliageRay, nearOrigin, planeNormal).xy - nearOrigin.xy) / nearSize + nearWind;
    let farUv = (planeHit(wall, foliageRay, farOrigin, planeNormal).xy - farOrigin.xy) / farSize + farWind;
    let transmission = blindTransmission * wandTransmission
      * (1.0 - min(1.0, leafCoverage(nearUv, nearLod) * params.density * 1.12))
      * (1.0 - min(1.0, leafCoverage(farUv, farLod) * params.density * mix(0.75, 1.5, params.night)));
    // Lambert cosine and inverse-square falloff weight the finite emitter.
    let distanceSquared = dot(ray, ray);
    let outgoing = -normalize(ray);
    let angularPosition = vec2f(dot(outgoing, beamRight), dot(outgoing, beamUp))
      / max(dot(outgoing, beamAxis), 0.001);
    let beamPosition = angularPosition / beamSpread;
    let emission = exp(-0.5 * dot(beamPosition, beamPosition));
    let weight = normalize(ray).z / distanceSquared * emission;
    incidentEnergy += weight;
    visibleEnergy += weight * transmission;
  }
  // Preserve irradiance separately: normalizing visibility alone cancels the beam.
  let visibility = visibleEnergy / max(incidentEnergy, 0.000001);
  // Keep cursor-directed light restrained on the left without removing the
  // simulated distance falloff or changing the right-side exposure.
  let sideExposure = mix(0.3, 1.0, smoothstep(0.0, 1.0, uv.x));
  let irradiance = incidentEnergy / (32.0 * referenceEnergy) * sideExposure;
  return vec4f(visibility, irradiance, 0.0, 1.0);
}
