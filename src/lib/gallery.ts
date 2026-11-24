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
  photo('dscf0016', 'A tabby and white cat resting on a garage floor'),
  photo('dscf0055', 'A tall atrium of glass and steel above a red wall'),
  photo('dscf0086', 'A colonnade of white columns around a courtyard garden'),
  photo('dscf0093', 'A green glass bottle and a dark vase on a table in warm light'),
  photo('dscf0095', 'Museum display cases under a glowing ring of light'),
  photo('dscf0102', 'A visitor leaning over display cases under a glowing ring of light'),
  photo('dscf0104', 'A carved wooden mythical creature in a museum gallery'),
  photo('dscf0111', 'A gilded palanquin with carved lions in a dark museum hall'),
  photo('dscf0112', 'Ship models in glass cases on a round white platform'),
  photo('dscf0119', 'A visitor looking at a framed painting on a dark wall'),
  photo('dscf0121', 'A visitor before a wall of small statues set in lit niches, seen from above'),
  photo('dscf0127', 'Visitors crossing a sunlit museum hall toward a statue'),
  photo('dscf0131', 'A visitor beside a stone statue, seen between wooden railings'),
  photo('dscf0136', 'Two visitors in a dim, warm museum hall, seen from above'),
  photo('dscf0142', 'A mannequin wrapped in a woven headscarf among hanging textiles'),
  photo('dscf0157', 'A staircase rising toward a bright skylight'),
  photo('dscf0186', 'Grilled meat, rice and side dishes crowding a restaurant table'),
  photo('dscf0215', 'People gathered at a bar under a woven pendant lamp'),
  photo('dscf0235', 'Three green drinks under a paper lamp on a wooden table'),
  photo('dscf0319', 'Dancers performing on a dirt field at an outdoor festival'),
  photo('dscf0355', 'People playing table tennis, seen from a balcony above'),
  photo('dscf0359', 'Two players mid-rally at a table tennis table, seen from above'),
  photo('dscf0370', 'An empty corridor ending in a tall window'),
  photo('dscf0403', 'A coffee shop on a street corner under a hazy sky'),
  photo('dscf0405', 'Two security guards seated at a desk under bamboo blinds'),
  photo('dscf0620', 'A dark kitten sitting beside a concrete pillar'),
  photo('dscf0623', 'Kittens huddled together on a sandy floor'),
  photo('dscf0634', 'A metal lunch tray with bread and sides on a wooden table'),
  photo('dscf0664', 'Fried noodles and dumplings in a bamboo steamer on a table'),
  photo('dscf0679', 'A tall lobby lined with marble columns'),
  photo('dscf0703', 'People ordering at a lit bakery counter'),
  photo('dscf0737', 'The sun reflected in a dark glass tower against a hazy sky'),
  photo('dscf0747', 'A sunlit concrete beam in front of a glass facade and trees'),
] as const satisfies readonly GalleryPhoto[]

/** How many photos the homepage grid shows before the See more tile. */
export const featuredCount = 11
