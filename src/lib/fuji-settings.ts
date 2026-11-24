// Exposure and Fujifilm JPEG settings read from a photo's EXIF, and the published recipes they
// can match. tools/gallery/metadata.ts writes both into src/assets/gallery/photos.json.

export type Exposure = {
  /** As the camera prints it, e.g. `1/250` or `2`. */
  shutter: string
  aperture: number
  iso: number
  /** In millimetres. */
  focalLength: number
  /** In stops, rounded to two decimals, e.g. `-0.33`. */
  exposureCompensation: number
  lens: string
}

export type FujiSettings = {
  /** E.g. `Classic Chrome`, `Provia`, or a monochrome mode such as `Acros`. */
  filmSimulation: string
  /** `Auto`, `DR100`, `DR200` or `DR400`. */
  dynamicRange: string
  /** `Off` or roughness and size, e.g. `Strong, Large`. */
  grain: string
  colorChromeEffect: string
  colorChromeFxBlue: string
  /** `Auto`, a preset such as `Daylight`, or a temperature such as `5200K`. */
  whiteBalance: string
  /** In the camera's own steps, -9 to +9. */
  whiteBalanceShift: { red: number; blue: number }
  highlight: number
  shadow: number
  /** Null for monochrome film simulations. */
  color: number | null
  sharpness: number
  noiseReduction: number
  clarity: number
}

/** exiftool's JSON output (`-j`) for the tags `fujiExifTags` lists. */
export type FujiExif = Record<string, string | number | undefined>

/** exiftool arguments: `#` keeps a tag numeric; the others print as the camera labels them. */
export const fujiExifTags = [
  '-ExposureTime',
  '-FNumber#',
  '-ISO#',
  '-FocalLength#',
  '-ExposureCompensation#',
  '-LensModel',
  '-FujiFilm:FilmMode',
  '-FujiFilm:Saturation',
  '-FujiFilm:DynamicRangeSetting',
  '-FujiFilm:DevelopmentDynamicRange',
  '-FujiFilm:GrainEffectRoughness',
  '-FujiFilm:GrainEffectSize',
  '-FujiFilm:ColorChromeEffect',
  '-FujiFilm:ColorChromeFXBlue',
  '-FujiFilm:WhiteBalance',
  '-FujiFilm:ColorTemperature',
  '-FujiFilm:WhiteBalanceFineTune',
  '-FujiFilm:HighlightTone',
  '-FujiFilm:ShadowTone',
  '-FujiFilm:Sharpness',
  '-FujiFilm:NoiseReduction',
  '-FujiFilm:Clarity',
]

function text(exif: FujiExif, tag: string) {
  const value = exif[tag]
  if (value === undefined) throw new Error(`Missing EXIF tag ${tag}`)
  return String(value)
}

/** Reads the leading number of labels such as `-2 (soft)` or `+4 (highest)`. */
function level(exif: FujiExif, tag: string) {
  const value = Number.parseFloat(text(exif, tag))
  if (Number.isNaN(value)) throw new Error(`EXIF tag ${tag} is not a number: ${exif[tag]}`)
  return value
}

function filmSimulation(exif: FujiExif) {
  const mode = exif.FilmMode
  // Monochrome modes leave FilmMode out and name themselves in Saturation instead.
  if (mode === undefined) return text(exif, 'Saturation')
  const named = /\(([^)]+)\)$/.exec(String(mode))
  return named ? named[1] : String(mode)
}

function dynamicRange(exif: FujiExif) {
  if (exif.DynamicRangeSetting === 'Auto') return 'Auto'
  return `DR${exif.DevelopmentDynamicRange ?? 100}`
}

function whiteBalanceShift(exif: FujiExif) {
  // exiftool reports 20 units per camera step: `Red +100, Blue -120` is R+5, B-6.
  const match = /Red ([+-]?\d+), Blue ([+-]?\d+)/.exec(text(exif, 'WhiteBalanceFineTune'))
  if (!match) throw new Error(`Unreadable WhiteBalanceFineTune: ${exif.WhiteBalanceFineTune}`)
  return { red: Number(match[1]) / 20, blue: Number(match[2]) / 20 }
}

export function parseExposure(exif: FujiExif): Exposure {
  return {
    shutter: text(exif, 'ExposureTime'),
    aperture: level(exif, 'FNumber'),
    iso: level(exif, 'ISO'),
    focalLength: level(exif, 'FocalLength'),
    exposureCompensation: Math.round(level(exif, 'ExposureCompensation') * 100) / 100,
    lens: text(exif, 'LensModel'),
  }
}

export function parseFujiSettings(exif: FujiExif): FujiSettings {
  const roughness = text(exif, 'GrainEffectRoughness')
  const whiteBalance = text(exif, 'WhiteBalance')
  const color = Number.parseFloat(text(exif, 'Saturation'))
  return {
    filmSimulation: filmSimulation(exif),
    dynamicRange: dynamicRange(exif),
    grain: roughness === 'Off' ? 'Off' : `${roughness}, ${text(exif, 'GrainEffectSize')}`,
    colorChromeEffect: text(exif, 'ColorChromeEffect'),
    colorChromeFxBlue: text(exif, 'ColorChromeFXBlue'),
    whiteBalance: whiteBalance === 'Kelvin' ? `${text(exif, 'ColorTemperature')}K` : whiteBalance,
    whiteBalanceShift: whiteBalanceShift(exif),
    highlight: level(exif, 'HighlightTone'),
    shadow: level(exif, 'ShadowTone'),
    color: Number.isNaN(color) ? null : color,
    sharpness: level(exif, 'Sharpness'),
    noiseReduction: level(exif, 'NoiseReduction'),
    clarity: level(exif, 'Clarity'),
  }
}

export type FujiRecipe = {
  name: string
  author: string
  url: string
  /** Only the settings the published recipe states; a photo must match every one. */
  settings: Partial<FujiSettings>
}

// Recipes Imo shoots. Exposure compensation and ISO vary per shot, so matching ignores them.
export const fujiRecipes: readonly FujiRecipe[] = [
  {
    name: 'Summer Chrome',
    author: 'Osan Bilgi',
    url: 'https://www.osan-bilgi.com/summer-chrome',
    settings: {
      filmSimulation: 'Classic Chrome',
      dynamicRange: 'DR400',
      grain: 'Strong, Large',
      colorChromeEffect: 'Strong',
      colorChromeFxBlue: 'Strong',
      whiteBalance: 'Auto',
      whiteBalanceShift: { red: 5, blue: -6 },
      highlight: -2,
      shadow: -2,
      color: 4,
      sharpness: 0,
      noiseReduction: -4,
      clarity: -4,
    },
  },
  {
    // The X-Trans V version, which turns Color Chrome FX Blue from Weak to Off.
    name: 'Kodak Portra 400 v2',
    author: 'Fuji X Weekly',
    url: 'https://fujixweekly.com/2022/12/16/kodak-portra-400-v2-fujifilm-x-t5-x-trans-v-film-simulation-recipe/',
    settings: {
      filmSimulation: 'Classic Chrome',
      dynamicRange: 'DR400',
      grain: 'Strong, Small',
      colorChromeEffect: 'Strong',
      colorChromeFxBlue: 'Off',
      whiteBalance: '5200K',
      whiteBalanceShift: { red: 1, blue: -6 },
      highlight: 0,
      shadow: -2,
      color: 2,
      sharpness: -2,
      noiseReduction: -4,
      clarity: -2,
    },
  },
  {
    // Published with Color Chrome FX Blue Weak; Fuji X Weekly sets it Off on X-Trans V.
    name: "Reggie's Portra",
    author: 'Reggie Ballesteros',
    url: 'https://fujixweekly.com/2022/06/11/fujifilm-x-trans-iv-film-simulation-recipe-reggies-portra/',
    settings: {
      filmSimulation: 'Classic Chrome',
      dynamicRange: 'Auto',
      grain: 'Weak, Small',
      colorChromeEffect: 'Strong',
      colorChromeFxBlue: 'Off',
      whiteBalance: 'Auto',
      whiteBalanceShift: { red: 2, blue: -4 },
      highlight: -1,
      shadow: -1,
      color: 2,
      sharpness: -2,
      noiseReduction: -4,
      clarity: 0,
    },
  },
  {
    // The published card leaves out the white balance shift, sharpness, NR and clarity.
    name: 'Terracotta Sun',
    author: 'Fujifilm Simulations',
    url: 'https://fujifilmsimulations.com/project/terracotta-sun/',
    settings: {
      filmSimulation: 'Provia',
      dynamicRange: 'Auto',
      grain: 'Weak, Small',
      colorChromeEffect: 'Strong',
      colorChromeFxBlue: 'Weak',
      whiteBalance: 'Auto',
      highlight: -2,
      shadow: -1.5,
      color: 2,
    },
  },
]

type ScalarSetting = Exclude<keyof FujiSettings, 'whiteBalanceShift'>

const scalarSettings = [
  'filmSimulation',
  'dynamicRange',
  'grain',
  'colorChromeEffect',
  'colorChromeFxBlue',
  'whiteBalance',
  'highlight',
  'shadow',
  'color',
  'sharpness',
  'noiseReduction',
  'clarity',
] as const satisfies readonly ScalarSetting[]

/** Whether every setting the recipe states equals the photo's. */
function matchesRecipe(settings: FujiSettings, recipe: FujiRecipe) {
  const shift = recipe.settings.whiteBalanceShift
  // Compared by field: photos.json sorts keys, so the shift's key order can differ.
  const shiftMatches =
    shift === undefined ||
    (shift.red === settings.whiteBalanceShift.red && shift.blue === settings.whiteBalanceShift.blue)
  return (
    shiftMatches &&
    scalarSettings.every(
      (key) => recipe.settings[key] === undefined || recipe.settings[key] === settings[key],
    )
  )
}

/** The first recipe whose stated settings all equal the photo's, or null. */
export function matchRecipe(
  settings: FujiSettings,
  recipes: readonly FujiRecipe[] = fujiRecipes,
): FujiRecipe | null {
  return recipes.find((recipe) => matchesRecipe(settings, recipe)) ?? null
}
