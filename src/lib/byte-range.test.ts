import { strict as assert } from 'node:assert'
import { describe, test } from 'node:test'

import { parseRange, withByteRange } from '#/lib/byte-range'

const file = new Uint8Array(Array.from({ length: 100 }, (_, index) => index))

function asset(init: { length?: boolean; encoding?: string } = {}) {
  const headers = new Headers({ 'Content-Type': 'video/webm', ETag: '"abc"' })
  if (init.length !== false) headers.set('Content-Length', String(file.byteLength))
  if (init.encoding) headers.set('Content-Encoding', init.encoding)
  return new Response(file, { headers })
}

function get(headers: Record<string, string> = {}, method = 'GET') {
  return new Request('https://example.com/assets/demo-abc123.webm', { method, headers })
}

void describe('parseRange', () => {
  void test('reads closed, open, and suffix ranges', () => {
    assert.deepEqual(parseRange('bytes=0-9', 100), { start: 0, end: 9 })
    assert.deepEqual(parseRange('bytes=90-', 100), { start: 90, end: 99 })
    assert.deepEqual(parseRange('bytes=-10', 100), { start: 90, end: 99 })
  })

  void test('clamps ranges that run past the end', () => {
    assert.deepEqual(parseRange('bytes=50-500', 100), { start: 50, end: 99 })
    assert.deepEqual(parseRange('bytes=-500', 100), { start: 0, end: 99 })
  })

  void test('rejects ranges past the end', () => {
    assert.equal(parseRange('bytes=100-', 100), 'unsatisfiable')
    assert.equal(parseRange('bytes=-0', 100), 'unsatisfiable')
  })

  void test('ignores multiple, malformed, and other-unit ranges', () => {
    assert.equal(parseRange('bytes=0-1,5-6', 100), null)
    assert.equal(parseRange('bytes=9-0', 100), null)
    assert.equal(parseRange('bytes=-', 100), null)
    assert.equal(parseRange('items=0-1', 100), null)
  })
})

void describe('withByteRange', () => {
  void test('answers a range with 206 and just those bytes', async () => {
    const response = await withByteRange(get({ Range: 'bytes=0-1' }), asset())
    assert.equal(response.status, 206)
    assert.equal(response.headers.get('Content-Range'), 'bytes 0-1/100')
    assert.equal(response.headers.get('Content-Length'), '2')
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes')
    assert.equal(response.headers.get('ETag'), '"abc"')
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0, 1])
  })

  void test('streams a whole-file range as 206', async () => {
    const response = await withByteRange(get({ Range: 'bytes=0-' }), asset())
    assert.equal(response.status, 206)
    assert.equal(response.headers.get('Content-Range'), 'bytes 0-99/100')
    assert.equal((await response.arrayBuffer()).byteLength, 100)
  })

  void test('learns the size from the body when no length is declared', async () => {
    const response = await withByteRange(get({ Range: 'bytes=-3' }), asset({ length: false }))
    assert.equal(response.headers.get('Content-Range'), 'bytes 97-99/100')
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [97, 98, 99])
  })

  void test('refuses a range past the end with 416', async () => {
    const response = await withByteRange(get({ Range: 'bytes=200-' }), asset())
    assert.equal(response.status, 416)
    assert.equal(response.headers.get('Content-Range'), 'bytes */100')
  })

  void test('sends headers only for HEAD', async () => {
    const response = await withByteRange(get({ Range: 'bytes=10-19' }, 'HEAD'), asset())
    assert.equal(response.status, 206)
    assert.equal(response.headers.get('Content-Length'), '10')
    assert.equal((await response.arrayBuffer()).byteLength, 0)
  })

  void test('sends the whole file without a Range, or with a stale If-Range', async () => {
    const plain = await withByteRange(get(), asset())
    assert.equal(plain.status, 200)
    assert.equal(plain.headers.get('Accept-Ranges'), 'bytes')
    const stale = await withByteRange(get({ Range: 'bytes=0-1', 'If-Range': '"old"' }), asset())
    assert.equal(stale.status, 200)
    assert.equal((await stale.arrayBuffer()).byteLength, 100)
    const fresh = await withByteRange(get({ Range: 'bytes=0-1', 'If-Range': '"abc"' }), asset())
    assert.equal(fresh.status, 206)
  })

  void test('passes through encoded bodies and non-200 responses', async () => {
    const encoded = await withByteRange(get({ Range: 'bytes=0-1' }), asset({ encoding: 'br' }))
    assert.equal(encoded.status, 200)
    assert.equal(encoded.headers.has('Accept-Ranges'), false)
    const missing = await withByteRange(
      get({ Range: 'bytes=0-1' }),
      new Response('Not found', { status: 404 }),
    )
    assert.equal(missing.status, 404)
  })
})
