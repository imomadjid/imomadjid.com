import {
  createServerEntry,
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'

import { withByteRange } from '#/lib/byte-range'

type Env = { ASSETS: { fetch: (request: Request) => Promise<Response> } }

// Start's own entry, as @tanstack/react-start/server-entry builds it.
const start = createServerEntry({ fetch: createStartHandler(defaultStreamHandler) })

// The preview videos, which wrangler.jsonc routes here ahead of the static assets
// (`run_worker_first`). Workers static assets don't answer byte ranges, and Safari plays video
// only from servers that do. Their names are content-hashed, so they never change in place.
const rangedMedia = /^\/assets\/[^/]+\.(?:webm|mp4)$/

export default {
  async fetch(request: Request, env: Env) {
    if (!rangedMedia.test(new URL(request.url).pathname)) return start.fetch(request)
    const response = await withByteRange(request, await env.ASSETS.fetch(request))
    if (response.ok) response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return response
  },
}
