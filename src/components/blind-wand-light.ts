import type { AmbientSettings } from '#/lib/ambient-settings'
import type { SceneLight } from '#/lib/sunlit-scene'

// A CPU port of the Sunlit light model (src/shaders/ambient-light.wgsl), evaluated only along
// the wand. The wand hangs on the room side of the slats, so it catches the same striped light
// as the wall behind it, shifted by its distance from the wall.

type Vec3 = [number, number, number]
export type Rgb = [number, number, number]

export type WandLight = {
  /** Share of the light at the wand that comes straight from the window, 0 to 1. */
  direct: number
  /** Unit direction toward the light in the horizontal plane: x right, z toward the viewer. */
  toLightX: number
  toLightZ: number
  /** Color of the direct light, sRGB 0 to 1. */
  sun: Rgb
  /** The wall's surface color, sRGB 0 to 1. */
  surface: Rgb
  night: number
  /** Light through the slats at evenly spaced points from the top of the wand to its tip. */
  stripes: number[]
}

const DAY_SUN: Rgb = [1, 0.962, 0.865]
const SUNSET_COOL: Rgb = [0.7, 0.77, 0.85]
const SUNSET_WARM: Rgb = [0.96, 0.59, 0.29]
const MOON: Rgb = [0.63, 0.76, 1]
// Light entering the clear rod scatters along it before it leaves, blurring slat edges on
// the rod by a few millimetres more than their penumbra alone (in wall heights).
const ROD_SCATTER = 0.003

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
function normalize(a: Vec3): Vec3 {
  return scale(a, 1 / Math.max(Math.hypot(a[0], a[1], a[2]), 1e-9))
}
export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}
export function mapRgb([red, green, blue]: Rgb, map: (channel: number) => number): Rgb {
  return [map(red), map(green), map(blue)]
}
export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
}
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const BLIND_NORMAL = normalize([0.342, 0, 0.94])
const BLIND_AXIS = normalize([0.94, 0, -0.342])

function planeHit(origin: Vec3, ray: Vec3, point: Vec3, normal: Vec3): Vec3 {
  const t = dot(sub(point, origin), normal) / dot(ray, normal)
  return [origin[0] + ray[0] * t, origin[1] + ray[1] * t, origin[2] + ray[2] * t]
}

/**
 * Light reaching the wand.
 * @param points Sample points along the wand in canvas UV space, top first.
 * @param aspect Canvas width over height.
 * @param depth The wand's distance from the wall, in wall heights.
 */
export function lightWand(
  settings: AmbientSettings,
  scene: SceneLight,
  points: readonly (readonly [number, number])[],
  aspect: number,
  depth: number,
): WandLight {
  const { night } = scene
  const angle = settings.light.angle + scene.entrance * (scene.entranceNight ? -8 : 6)
  const lightAngle = ((angle + night * 42) * Math.PI) / 180
  const source: Vec3 = [2.6, Math.tan(lightAngle) * 5, 5]
  const world = ([u, v]: readonly [number, number]): Vec3 => [(u - 1) * aspect, v, depth]

  const blindOrigin: Vec3 = [0, 0, settings.blinds.distance]
  const aim: Vec3 = [(scene.aimX - 1) * aspect, scene.aimY, 0]
  const spacing = settings.blinds.spacing
  const gap = mix(settings.blinds.opening, settings.blinds.opening * 0.5, night) * spacing * 0.5
  const stripes = points.map((point) => {
    const position = world(point)
    const hit = planeHit(position, sub(source, position), blindOrigin, BLIND_NORMAL)
    const local = sub(hit, blindOrigin)
    const within = Math.abs(dot(local, BLIND_AXIS)) < 2.5 && Math.abs(local[1] - 0.5) < 2
    if (!within) return 1
    const cell = local[1] / spacing
    const distance = Math.abs(cell - Math.floor(cell) - 0.5) * spacing
    // The same finite emitter as the wall's, widening away from the light's aim, gives a
    // penumbra in proportion to the slat's distance from the rod.
    const focus = Math.hypot(position[0] - aim[0], position[1] - aim[1])
    const sourceRadius =
      settings.light.softness *
      0.14 *
      (1 + settings.light.progressiveSoftness * smoothstep(0.12, 0.9, focus))
    const reach = Math.hypot(...sub(hit, position)) / Math.hypot(...sub(source, hit))
    const softness = sourceRadius * reach + ROD_SCATTER
    return 1 - smoothstep(gap - softness, gap + softness, distance)
  })

  // Beam emission and irradiance at the middle of the wand, as the shader weights each sample.
  const middle = points[Math.floor(points.length / 2)] ?? [1, 0.5]
  const position = world(middle)
  const beamAxis = normalize(sub(aim, source))
  const beamRight = normalize(cross(beamAxis, [0, 1, 0]))
  const beamUp = cross(beamRight, beamAxis)
  const spread = Math.hypot(...sub(aim, source))
  const spreadX = (aspect * settings.light.beamWidth) / spread
  const spreadY = 1.5 / spread
  const ray = sub(source, position)
  const outgoing = scale(normalize(ray), -1)
  const forward = Math.max(dot(outgoing, beamAxis), 0.001)
  const beamX = dot(outgoing, beamRight) / forward / spreadX
  const beamY = dot(outgoing, beamUp) / forward / spreadY
  const emission = Math.exp(-0.5 * (beamX * beamX + beamY * beamY))
  const weight = (normalize(ray)[2] / dot(ray, ray)) * emission
  const referenceRay = sub(source, [0, 0.45, 0])
  const referenceEnergy = normalize(referenceRay)[2] / dot(referenceRay, referenceRay)
  const sideExposure = mix(0.3, 1, smoothstep(0, 1, middle[0]))
  const directEnergy =
    (weight / referenceEnergy) * sideExposure * settings.light.intensity * mix(0.72, 0.62, night)
  const direct = directEnergy / (1 + directEnergy)

  // The same palette the material pass uses: warm sun, a sunset glow mid-change, cool moon.
  const glow = smoothstep(0, 0.3, night) * (1 - smoothstep(0.3, 0.85, night))
  const sunset = mixRgb(SUNSET_COOL, SUNSET_WARM, scene.direction * settings.light.warmth)
  const daySun = mixRgb([1, 1, 1], DAY_SUN, settings.light.warmth * 1.6)
  const dusk = mixRgb(daySun, sunset, Math.min(1, glow * 2))
  const sun = mixRgb(
    mixRgb(dusk, SUNSET_WARM, scene.entrance * scene.entranceNight * 0.5),
    MOON,
    smoothstep(0.45, 0.9, night),
  )
  const toLight = Math.hypot(ray[0], ray[2])

  return {
    direct,
    toLightX: ray[0] / toLight,
    toLightZ: ray[2] / toLight,
    sun,
    surface: scene.surface,
    night,
    stripes,
  }
}

/** A cross-section in units of the rod's radius: [x, z] points, counter-clockwise. */
export type Profile = readonly (readonly [number, number])[]

export type Facet = {
  /** Left and right edges in units of the rod's radius. */
  left: number
  right: number
  /** Outward normal: x right, z toward the viewer. */
  normalX: number
  normalZ: number
  /** How far the face stands out from the axis, 0 at the center to 1 at the outermost point. */
  ridge: number
}

/** A regular polygon, or a fluted star when `flute` is above 0. */
export function starProfile(points: number, lobes: number, flute: number): Profile {
  return Array.from({ length: points }, (_, index) => {
    const angle = (index / points) * Math.PI * 2
    const radius = 1 - flute + flute * Math.abs(Math.cos((lobes / 2) * angle))
    return [radius * Math.cos(angle), radius * Math.sin(angle)] as const
  })
}

/** A flat bar with chamfered corners, `width` across its face and `thickness` deep. */
export function barProfile(width: number, thickness: number, chamfer: number): Profile {
  const x = width / 2
  const z = thickness / 2
  return [
    [x, -z + chamfer],
    [x, z - chamfer],
    [x - chamfer, z],
    [-x + chamfer, z],
    [-x, z - chamfer],
    [-x, -z + chamfer],
    [-x + chamfer, -z],
    [x - chamfer, -z],
  ]
}

/**
 * Faces of a prism with this cross-section turned `turn` radians about its long axis, as seen
 * from the front, ordered left to right. Ribs and flats slide across and foreshorten toward
 * the silhouette as it turns.
 */
export function profileFacets(profile: Profile, turn: number): Facet[] {
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  const points = profile.map(([x, z]) => [x * cos - z * sin, x * sin + z * cos] as const)
  const outer = Math.max(...points.map(([x, z]) => Math.hypot(x, z)), 1e-6)
  const facets: Facet[] = []
  for (const [index, [ax, az]] of points.entries()) {
    const [bx, bz] = points[(index + 1) % points.length] ?? points[0] ?? [ax, az]
    const length = Math.hypot(bx - ax, bz - az)
    if (length < 1e-9) continue
    const normalX = (bz - az) / length
    const normalZ = -(bx - ax) / length
    if (normalZ <= 1e-6) continue
    facets.push({
      left: bx,
      right: ax,
      normalX,
      normalZ,
      ridge: (Math.hypot(ax, az) + Math.hypot(bx, bz)) / (2 * outer),
    })
  }
  return facets.sort((first, second) => first.left - second.left)
}

/** Lambert and Blinn-Phong terms for a facet, with the viewer straight ahead. */
export function facetLight(facet: Facet, light: WandLight, shininess: number) {
  const diffuse = Math.max(0, facet.normalX * light.toLightX + facet.normalZ * light.toLightZ)
  const halfX = light.toLightX
  const halfZ = light.toLightZ + 1
  const halfLength = Math.hypot(halfX, halfZ) || 1
  const facing = Math.max(0, (facet.normalX * halfX + facet.normalZ * halfZ) / halfLength)
  return { diffuse, specular: facing ** shininess }
}

export function toCss([red, green, blue]: Rgb) {
  const channel = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 255)
  return `rgb(${channel(red)} ${channel(green)} ${channel(blue)})`
}
