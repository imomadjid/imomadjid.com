import { placeFor } from './postmark-ledger'
import type { Ledger, LedgerStats, Pile, Visit } from './postmark-ledger'

// The postmark footer's API, which src/server.ts routes to:
//
//   GET  /api/postmarks        the pile and the visitor's stamp, if they have one; stamps no one
//   POST /api/postmarks        the same, stamping a new visitor (the page sends it once they've
//                              used the page, so a page that only loads stamps no one)
//   POST /api/postmarks/here   with the dev tools, an open tab checking in, for the online count
//   GET  /api/postmarks/stats  with the dev tools, counts: visitors, visits, places, countries,
//                              online
//   GET  /api/postmarks/where  with the dev tools, a page of what Cloudflare reads about the
//                              visitor's connection, to see how close its guess comes
//
// The visitor's id lives in an HttpOnly cookie; the ledger finds them by it.

/** The ledger's methods as the Worker calls them over RPC, where every answer is a promise. */
export type LedgerStub = {
  [Method in 'look' | 'stamp' | 'here' | 'stats']: (
    ...args: Parameters<Ledger[Method]>
  ) => Promise<Awaited<ReturnType<Ledger[Method]>>>
}

export const postmarkPath = '/api/postmarks'

const cookieName = '__Host-postmark'
// Browsers keep a cookie at most 400 days; each visit renews it.
const cookieAge = 400 * 86_400

function readCookie(header: string | null) {
  for (const part of header?.split(';') ?? []) {
    const [name, ...value] = part.trim().split('=')
    if (name === cookieName) return value.join('=') || undefined
  }
  return undefined
}

/** Cloudflare's reading of where the request came from; empty outside Cloudflare. */
type RequestGeo = {
  city?: string
  region?: string
  regionCode?: string
  country?: string
  postalCode?: string
  latitude?: string
  longitude?: string
  timezone?: string
  asn?: number
  asOrganization?: string
  colo?: string
}

function geoOf(request: Request): RequestGeo | undefined {
  // SAFETY: Workers add `cf` to every incoming request; it is undefined only in tests.
  return (request as Request & { cf?: RequestGeo }).cf
}

function visitOf(request: Request): Visit {
  const cf = geoOf(request)
  return {
    visitor: readCookie(request.headers.get('Cookie')),
    address: request.headers.get('CF-Connecting-IP') ?? '',
    userAgent: request.headers.get('User-Agent') ?? '',
    language: request.headers.get('Accept-Language') ?? '',
    geo: { city: cf?.city, region: cf?.region, countryCode: cf?.country },
  }
}

function json(body: Pile | LedgerStats) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

function withVisitor(response: Response, visitor: string | undefined) {
  if (visitor)
    response.headers.append(
      'Set-Cookie',
      `${cookieName}=${visitor}; Path=/; Max-Age=${cookieAge}; Secure; HttpOnly; SameSite=Lax`,
    )
  return response
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (character) => `&#${character.charCodeAt(0)};`)

/**
 * What Cloudflare reads about the request's connection, and the place its stamp would name, as
 * a page readable on a phone. It answers nothing it doesn't show the visitor, and keeps nothing.
 */
function wherePage(request: Request) {
  const cf = geoOf(request)
  const place = placeFor(visitOf(request).geo)
  const point = cf?.latitude && cf.longitude ? `${cf.latitude}, ${cf.longitude}` : undefined
  const map = point
    ? `https://www.openstreetmap.org/?mlat=${cf?.latitude}&mlon=${cf?.longitude}#map=11/${cf?.latitude}/${cf?.longitude}`
    : undefined
  const rows: [string, string | undefined, string?][] = [
    [
      'Stamp would say',
      place
        ? `${place.name}${place.region && place.region !== place.name ? `, ${place.region}` : ''}`
        : 'No stamp',
    ],
    ['City', cf?.city],
    [
      'Province or region',
      cf?.region && `${cf.region}${cf.regionCode ? ` (${cf.regionCode})` : ''}`,
    ],
    ['Country', cf?.country],
    ['Postal code', cf?.postalCode],
    ['Map point', point, map],
    ['Time zone', cf?.timezone],
    ['Provider', cf?.asOrganization && `${cf.asOrganization}${cf.asn ? ` (AS${cf.asn})` : ''}`],
    ['Address', request.headers.get('CF-Connecting-IP') ?? undefined],
    ['Cloudflare data centre', cf?.colo],
  ]
  const body = rows
    .map(([label, value, link]) => {
      const shown = escapeHtml(value || '—')
      return `<tr><th>${label}</th><td>${link ? `<a href="${escapeHtml(link)}">${shown}</a>` : shown}</td></tr>`
    })
    .join('')
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Where Cloudflare thinks you are</title><style>:root{color-scheme:light dark;font:16px/1.4 system-ui,sans-serif}body{margin:0 auto;max-width:36rem;padding:24px 16px}h1{font-size:1.25rem;margin:0 0 4px}p{margin:0 0 20px;opacity:.65}table{border-collapse:collapse;width:100%}th,td{padding:10px 0;border-top:1px solid #8884;text-align:left;vertical-align:top}th{font-weight:500;opacity:.65;padding-right:16px;width:40%}a{color:inherit}</style></head><body><h1>Where Cloudflare thinks you are</h1><p>Read from this connection just now, and not kept. Try it on Wi-Fi and on mobile data.</p><table>${body}</table></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    },
  )
}

export async function postmarkApi(request: Request, ledger: LedgerStub) {
  const url = new URL(request.url)
  const visit = visitOf(request)
  // Writes come only from the site's own pages.
  if (request.method === 'POST' && request.headers.get('Origin') !== url.origin)
    return new Response('Forbidden', { status: 403 })

  if (url.pathname === postmarkPath && request.method === 'GET') {
    const { visitor, pile } = await ledger.look(visit)
    return withVisitor(json(pile), visitor)
  }
  if (url.pathname === postmarkPath && request.method === 'POST') {
    const { visitor, pile } = await ledger.stamp(visit)
    return withVisitor(json(pile), visitor)
  }
  if (
    import.meta.env.DEV_TOOLS &&
    url.pathname === `${postmarkPath}/here` &&
    request.method === 'POST'
  ) {
    await ledger.here(visit.visitor)
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }
  // The counts, and the check-ins they take, are for the dev fixture, not the site.
  if (
    import.meta.env.DEV_TOOLS &&
    url.pathname === `${postmarkPath}/stats` &&
    request.method === 'GET'
  )
    return json(await ledger.stats())
  if (
    import.meta.env.DEV_TOOLS &&
    url.pathname === `${postmarkPath}/where` &&
    request.method === 'GET'
  )
    return wherePage(request)
  return new Response('Not found', { status: 404 })
}
