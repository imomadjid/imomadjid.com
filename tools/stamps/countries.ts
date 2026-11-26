// Countries whose postage stamps the postmark footer draws from, keyed by ISO 3166-1 alpha-2 code, as
// Cloudflare reports a visitor's country. Each lists the Wikimedia Commons category that holds
// one subcategory per year ("1971 stamps of Indonesia").
export type Country = {
  name: string
  byYear: string
  // Stamps after this year stay out of the candidates: US stamps from 1978 on are USPS copyright.
  lastYear?: number
}

export const countries = {
  id: { name: 'Indonesia', byYear: 'Category:Stamps of Indonesia by year' },
  us: {
    name: 'United States',
    byYear: 'Category:Stamps of the United States by year',
    lastYear: 1977,
  },
} as const satisfies Record<string, Country>

export type CountryKey = keyof typeof countries

export function isCountryKey(key: string): key is CountryKey {
  return Object.hasOwn(countries, key)
}
