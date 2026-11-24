import sizes from '#/assets/gallery/photos.json'

// tools/gallery/import.sh writes <stem>-240, -640 and -1600.webp per photo plus their size
// in photos.json. Vite fingerprints the files into /assets/; only the URLs are bundled.
const files = import.meta.glob<string>('../assets/gallery/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

export type GalleryPhoto = {
  /** The Drive filename's stem in lowercase, e.g. `dscf0006`. */
  id: string
  alt: string
  width: number
  height: number
  thumb: string
  small: string
  large: string
}

function file(name: string) {
  const url = files[`../assets/gallery/${name}`]
  if (url === undefined) throw new Error(`No gallery photo at src/assets/gallery/${name}`)
  return url
}

function photo(id: keyof typeof sizes, alt: string): GalleryPhoto {
  const { width, height } = sizes[id]
  return {
    id,
    alt,
    width,
    height,
    thumb: file(`${id}-240.webp`),
    small: file(`${id}-640.webp`),
    large: file(`${id}-1600.webp`),
  }
}

// Display order. The first `featuredCount` fill the homepage grid; the See more tile previews
// the rest, and the overlay holds them all. Reorder to choose the favourites.
export const galleryPhotos = [
  photo('dscf0006', 'A black and white cat on a tiled floor beside a cardboard box'),
  photo('dscf0097', 'An old manuscript lying open in a museum display case'),
  photo('dscf0137', 'A carved wooden screen with an interlocking geometric pattern'),
  photo('dscf0233', 'Two green drinks on a wooden counter by a window full of trees'),
  photo('dscf0066', 'White stone sculptures lit in a dark museum gallery'),
  photo('dscf0623', 'Kittens huddled together on a sandy floor'),
  photo('dscf0263', 'Square brass tiles with symbols mounted on a black wall'),
  photo('dscf0127', 'Visitors crossing a sunlit museum hall toward a statue'),
  photo('dscf0293', 'A crumpled ball of foil casting a shadow on a white table'),
  photo('dscf0664', 'Fried noodles and dumplings in a bamboo steamer on a table'),
  photo('dscf0043', 'A desk chair and a standing fan in a room lit by a window'),
  photo('dscf0361', 'People playing table tennis, seen from a balcony above'),
  photo('dscf0056', 'A tall atrium of glass and steel above a red wall'),
  photo('dscf0076', 'A dark carved stone pedestal in a museum'),
  photo('dscf0086', 'A colonnade of white columns around a courtyard garden'),
  photo('dscf0117', 'Shadow puppets displayed against a white curtain'),
  photo('dscf0161', 'A row of red railings in front of an office building'),
  photo('dscf0181', 'A tray of Japanese dishes on a wooden table'),
  photo('dscf0313', 'Dancers performing on a dirt field at an outdoor festival'),
  photo('dscf0371', 'An empty corridor ending in a tall window'),
  photo('dscf0402', 'A coffee shop on a street corner under a hazy sky'),
  photo('dscf0551', 'Dense green shrubs in soft light'),
  photo('dscf0561', 'A garden path and a red car seen from an upstairs window'),
  photo('dscf0633', 'A metal school lunch tray with bread and sides'),
] as const satisfies readonly GalleryPhoto[]

/** How many photos the homepage grid shows before the See more tile. */
export const featuredCount = 11
