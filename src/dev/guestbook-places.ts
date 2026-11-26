import type { PostmarkPlace } from './postmark-kit'
import places from './postmark-places.json'

// Where the prototype wall's made-up visitors come from, and how often: mostly Depok and the
// rest of Indonesia, then the places the pilot drew for. Places beyond postmark-places.json have
// no map outline of their own; their region's or country's drawings stand in.

// A rounded blob standing in for a map outline.
const outline =
  'M50 6C71 6 92 20 94 42C96 62 84 80 66 90C52 97 34 96 21 86C8 76 4 58 8 42C12 22 30 6 50 6Z'

const extra = (
  key: string,
  name: string,
  region: string,
  country: string,
  countryCode: string,
): PostmarkPlace => ({ key, name, region, country, countryCode, outline })

const known: PostmarkPlace[] = places
const find = (key: string) => {
  const place = known.find((candidate) => candidate.key === key)
  if (!place) throw new Error(`No place ${key}`)
  return place
}

export const wallPlaces: { place: PostmarkPlace; weight: number }[] = [
  { place: find('depok'), weight: 24 },
  { place: find('jakarta-barat'), weight: 9 },
  { place: extra('jakarta-selatan', 'South Jakarta', 'Jakarta', 'Indonesia', 'ID'), weight: 7 },
  { place: find('bandung'), weight: 6 },
  { place: extra('bogor', 'Bogor', 'West Java', 'Indonesia', 'ID'), weight: 4 },
  { place: find('yogyakarta'), weight: 3 },
  { place: find('singapore'), weight: 5 },
  { place: find('san-francisco'), weight: 6 },
  { place: extra('los-angeles', 'Los Angeles', 'California', 'United States', 'US'), weight: 3 },
  { place: extra('brooklyn', 'Brooklyn', 'New York', 'United States', 'US'), weight: 3 },
  { place: extra('austin', 'Austin', 'Texas', 'United States', 'US'), weight: 2 },
  { place: extra('baltimore', 'Baltimore', 'Maryland', 'United States', 'US'), weight: 1 },
  { place: find('shibuya'), weight: 3 },
  { place: extra('kyoto', 'Kyoto', 'Kyoto', 'Japan', 'JP'), weight: 1 },
  { place: find('london'), weight: 3 },
]
