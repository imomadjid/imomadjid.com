type ByteRange = { start: number; end: number }

/**
 * Reads a single-range `Range` header (`bytes=0-499`, `bytes=500-`, `bytes=-500`) against a file
 * of `size` bytes. Returns null for anything else, multiple ranges included, which is answered
 * with the whole file, as RFC 9110 allows; 'unsatisfiable' when the range starts past the end.
 */
export function parseRange(header: string, size: number): ByteRange | 'unsatisfiable' | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null
  const [, first = '', last = ''] = match
  if (first === '') {
    // A suffix: the last n bytes.
    if (last === '') return null
    const length = Number(last)
    if (length === 0 || size === 0) return 'unsatisfiable'
    return { start: Math.max(0, size - length), end: size - 1 }
  }
  const start = Number(first)
  const end = last === '' ? Number.POSITIVE_INFINITY : Number(last)
  if (end < start) return null
  if (start >= size) return 'unsatisfiable'
  return { start, end: Math.min(end, size - 1) }
}

/**
 * Answers `request`'s `Range` header from `response`, the whole file. Workers static assets reply
 * to ranges with a 200 and the full body, and Safari won't play a video served that way, so the
 * Worker cuts the range itself. Anything it can't range (not a 200, an encoded body, a stale
 * `If-Range`, no or an unreadable `Range`) passes through, advertising byte ranges where it can.
 */
export async function withByteRange(request: Request, response: Response): Promise<Response> {
  const headers = new Headers(response.headers)
  const header = request.headers.get('Range')
  const ifRange = request.headers.get('If-Range')
  const rangeable = response.status === 200 && !headers.has('Content-Encoding')
  if (rangeable) headers.set('Accept-Ranges', 'bytes')
  const passThrough = () =>
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  if (!rangeable || header === null || (ifRange !== null && ifRange !== headers.get('ETag'))) {
    return passThrough()
  }

  // The asset's length is normally declared; without it, read the body to learn it.
  const declared = Number(headers.get('Content-Length') ?? Number.NaN)
  let buffer: ArrayBuffer | null = null
  let size = declared
  if (!Number.isSafeInteger(declared)) {
    buffer = await response.arrayBuffer()
    size = buffer.byteLength
  }
  const range = parseRange(header, size)
  if (range === null) return buffer === null ? passThrough() : new Response(buffer, { headers })
  const head = request.method === 'HEAD'

  if (range === 'unsatisfiable') {
    if (buffer === null) await response.body?.cancel()
    headers.delete('Content-Length')
    headers.set('Content-Range', `bytes */${size}`)
    return new Response(null, { status: 416, headers })
  }

  headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`)
  headers.set('Content-Length', String(range.end - range.start + 1))
  // The whole file (Chrome opens with `bytes=0-`) streams through without buffering.
  if (buffer === null && range.start === 0 && range.end === size - 1) {
    return new Response(head ? null : response.body, { status: 206, headers })
  }
  buffer ??= await response.arrayBuffer()
  return new Response(head ? null : buffer.slice(range.start, range.end + 1), {
    status: 206,
    headers,
  })
}
