import type { LedgerStats, Pile, Visit } from './postmark-ledger'

// The postmark footer's API, which src/server.ts routes to with the dev tools on:
//
//   GET  /api/postmarks        the pile and the visitor's stamp, if they have one; stamps no one
//   POST /api/postmarks        the same, stamping a new visitor (the page sends it once they've
//                              used the page, so a page that only loads stamps no one)
//   POST /api/postmarks/here   an open tab checking in, for the online count
//   GET  /api/postmarks/stats  counts: visitors, visits, places, countries, online
//
// The visitor's id lives in an HttpOnly cookie; the ledger finds them by it.

/** The ledger's methods as the Worker calls them over RPC. */
export type LedgerStub = {
  look: (visit: Visit) => Promise<{ visitor: string | undefined; pile: Pile }>
  stamp: (visit: Visit) => Promise<{ visitor: string | undefined; pile: Pile }>
  here: (visitor: string | undefined) => Promise<void>
  stats: () => Promise<LedgerStats>
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
type RequestGeo = { city?: string; region?: string; country?: string }

function visitOf(request: Request): Visit {
  // SAFETY: Workers add `cf` to every incoming request; it is undefined only in tests.
  const cf = (request as Request & { cf?: RequestGeo }).cf
  return {
    visitor: readCookie(request.headers.get('Cookie')),
    address: request.headers.get('CF-Connecting-IP') ?? '',
    userAgent: request.headers.get('User-Agent') ?? '',
    language: request.headers.get('Accept-Language') ?? '',
    geo: { city: cf?.city, region: cf?.region, countryCode: cf?.country },
  }
}

function json(body: Pile | LedgerStats, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(body), { ...init, headers })
}

function withVisitor(response: Response, visitor: string | undefined) {
  if (visitor)
    response.headers.append(
      'Set-Cookie',
      `${cookieName}=${visitor}; Path=/; Max-Age=${cookieAge}; Secure; HttpOnly; SameSite=Lax`,
    )
  return response
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
  if (url.pathname === `${postmarkPath}/here` && request.method === 'POST') {
    await ledger.here(visit.visitor)
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }
  if (url.pathname === `${postmarkPath}/stats` && request.method === 'GET')
    return json(await ledger.stats())
  return new Response('Not found', { status: 404 })
}
