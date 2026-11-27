// Sleep Focus: whether Imo's phone is in its Sleep Focus, which puts the homepage avatar to sleep.
// Two Shortcuts automations on the phone (Sleep turning on, Sleep turning off) send it here:
//
//   GET  /api/sleep        { asleep, since }, read by the homepage
//   POST /api/sleep/on     Sleep Focus turned on; needs `Authorization: Bearer <SLEEP_TOKEN>`
//   POST /api/sleep/off    Sleep Focus turned off; the same
//
// SLEEP_TOKEN is a Worker secret (`wrangler secret put SLEEP_TOKEN`, with `--env dev` for the dev
// site); without it every write is refused. The state lives in one Durable Object for the site
// (src/lib/sleep-focus-object.ts, bound as SLEEP), a separate one for the dev site.

export const sleepPath = '/api/sleep'

/** The state as stored: asleep or not, and since when (ms since the epoch). */
export type SleepRecord = { asleep: boolean; since: number }

/** What GET answers. `since` is null before the phone has ever reported. */
export type SleepState = { asleep: boolean; since: number | null }

/** The Durable Object's methods as the Worker calls them over RPC. */
export type SleepStub = {
  read: () => Promise<SleepRecord | undefined>
  set: (asleep: boolean, now: number) => Promise<SleepRecord>
}

/**
 * The longest a sleep counts before it ends by itself. If the phone's "off" request never
 * arrives (no signal on waking, a failed automation), the avatar wakes up on its own.
 */
export const longestSleep = 14 * 3_600_000

/** The state at `now`: a sleep older than `longestSleep` has ended. */
export function stateAt(record: SleepRecord | undefined, now: number): SleepState {
  if (!record) return { asleep: false, since: null }
  if (record.asleep && now - record.since > longestSleep)
    return { asleep: false, since: record.since + longestSleep }
  return record
}

/**
 * The record after a report. Turning on while already asleep keeps the time it began, so a
 * repeated or retried request changes nothing; so does turning off while awake.
 */
export function afterReport(
  record: SleepRecord | undefined,
  asleep: boolean,
  now: number,
): SleepRecord {
  const current = stateAt(record, now)
  if (current.asleep === asleep && current.since !== null) return { asleep, since: current.since }
  return { asleep, since: now }
}

// Compares the secret as SHA-256 digests, so the time taken says nothing about how much of it
// matched, nor its length.
async function sameSecret(given: string, secret: string) {
  const encoder = new TextEncoder()
  const [a, b] = await Promise.all(
    [given, secret].map(
      async (value) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))),
    ),
  )
  let difference = 0
  for (let index = 0; index < a.length; index++) difference |= a[index] ^ b[index]
  return difference === 0
}

function json(body: SleepState, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function sleepApi(
  request: Request,
  store: SleepStub,
  token: string | undefined,
  now = Date.now(),
) {
  const { pathname } = new URL(request.url)
  if (pathname === sleepPath && request.method === 'GET')
    return json(stateAt(await store.read(), now))

  const report = { [`${sleepPath}/on`]: true, [`${sleepPath}/off`]: false }[pathname]
  if (report === undefined) return new Response('Not found', { status: 404 })
  if (request.method !== 'POST')
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
  if (!token) return new Response('Sleep Focus is not set up', { status: 503 })
  const [scheme, given] = request.headers.get('Authorization')?.split(' ') ?? []
  if (scheme !== 'Bearer' || !given || !(await sameSecret(given, token)))
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
    })
  return json(stateAt(await store.set(report, now), now))
}
