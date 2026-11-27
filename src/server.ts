import {
  createServerEntry,
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'

import { withByteRange } from '#/lib/byte-range'
import { postmarkApi, postmarkPath } from '#/lib/postmark-api'
import type { LedgerStub } from '#/lib/postmark-api'
import { sleepApi, sleepPath } from '#/lib/sleep-focus'
import type { SleepStub } from '#/lib/sleep-focus'

// The postmark footer's ledger, a Durable Object (wrangler.jsonc binds it as POSTMARKS).
export { PostmarkLedger } from '#/lib/postmark-ledger-object'
// Sleep Focus's state, a Durable Object (wrangler.jsonc binds it as SLEEP).
export { SleepFocus } from '#/lib/sleep-focus-object'

// A Durable Object's id, which only its namespace reads.
type ObjectId = { toString: () => string }

type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  POSTMARKS: { idFromName: (name: string) => ObjectId; get: (id: ObjectId) => LedgerStub }
  SLEEP: { idFromName: (name: string) => ObjectId; get: (id: ObjectId) => SleepStub }
  // The Shortcuts automations' bearer token, a Worker secret; unset, Sleep Focus takes no reports.
  SLEEP_TOKEN?: string
}

// Start's own entry, as @tanstack/react-start/server-entry builds it.
const start = createServerEntry({ fetch: createStartHandler(defaultStreamHandler) })

// The preview videos, which wrangler.jsonc routes here ahead of the static assets
// (`run_worker_first`). Workers static assets don't answer byte ranges, and Safari plays video
// only from servers that do. Their names are content-hashed, so they never change in place.
const rangedMedia = /^\/assets\/[^/]+\.(?:webm|mp4)$/

export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url)
    if (pathname.startsWith(postmarkPath))
      return postmarkApi(request, env.POSTMARKS.get(env.POSTMARKS.idFromName('ledger')))
    if (pathname === sleepPath || pathname.startsWith(`${sleepPath}/`))
      return sleepApi(request, env.SLEEP.get(env.SLEEP.idFromName('sleep')), env.SLEEP_TOKEN)
    if (!rangedMedia.test(pathname)) return start.fetch(request)
    const response = await withByteRange(request, await env.ASSETS.fetch(request))
    if (response.ok) response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return response
  },
}
