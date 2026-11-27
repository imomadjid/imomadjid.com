import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { afterReport, longestSleep, sleepApi, stateAt } from './sleep-focus'
import type { SleepRecord, SleepStub } from './sleep-focus'

function memoryStore(): SleepStub & { record?: SleepRecord } {
  const store: SleepStub & { record?: SleepRecord } = {
    read: async () => store.record,
    set: async (asleep, now) => (store.record = afterReport(store.record, asleep, now)),
  }
  return store
}

const origin = 'https://imomadjid.com'
const token = 'a-long-random-secret'

function report(state: 'on' | 'off', authorization?: string, method = 'POST') {
  return new Request(`${origin}/api/sleep/${state}`, {
    method,
    headers: authorization ? { Authorization: authorization } : {},
  })
}

const read = () => new Request(`${origin}/api/sleep`)

void describe('stateAt', () => {
  void test('is awake before any report', () => {
    assert.deepEqual(stateAt(undefined, 0), { asleep: false, since: null })
  })

  void test('ends a sleep that has gone on too long', () => {
    const record = { asleep: true, since: 1000 }
    assert.deepEqual(stateAt(record, 1000 + longestSleep), record)
    assert.deepEqual(stateAt(record, 1001 + longestSleep), {
      asleep: false,
      since: 1000 + longestSleep,
    })
  })
})

void describe('afterReport', () => {
  void test('keeps when a sleep began through repeated reports', () => {
    const first = afterReport(undefined, true, 100)
    assert.deepEqual(afterReport(first, true, 500), { asleep: true, since: 100 })
    assert.deepEqual(afterReport(first, false, 900), { asleep: false, since: 900 })
  })

  void test('starts a new sleep after one has run out', () => {
    const stale = { asleep: true, since: 0 }
    assert.deepEqual(afterReport(stale, true, longestSleep + 10), {
      asleep: true,
      since: longestSleep + 10,
    })
  })
})

void describe('sleepApi', () => {
  void test('reports on and off with the token, and reads them back', async () => {
    const store = memoryStore()
    const on = await sleepApi(report('on', `Bearer ${token}`), store, token, 100)
    assert.equal(on.status, 200)
    assert.deepEqual(await (await sleepApi(read(), store, token, 200)).json(), {
      asleep: true,
      since: 100,
    })

    await sleepApi(report('off', `Bearer ${token}`), store, token, 300)
    assert.deepEqual(await (await sleepApi(read(), store, token, 400)).json(), {
      asleep: false,
      since: 300,
    })
  })

  void test('refuses reports without the right token', async () => {
    const store = memoryStore()
    for (const authorization of [undefined, 'Bearer wrong', `Basic ${token}`, 'Bearer'])
      assert.equal((await sleepApi(report('on', authorization), store, token)).status, 401)
    assert.equal(store.record, undefined)
  })

  void test('refuses every report while no token is set', async () => {
    const store = memoryStore()
    assert.equal((await sleepApi(report('on', 'Bearer '), store, undefined)).status, 503)
    assert.equal((await sleepApi(report('on', 'Bearer x'), store, '')).status, 503)
    assert.equal(store.record, undefined)
  })

  void test('takes reports only as POSTs, and answers nothing else', async () => {
    const store = memoryStore()
    assert.equal((await sleepApi(report('on', `Bearer ${token}`, 'GET'), store, token)).status, 405)
    const other = new Request(`${origin}/api/sleep/maybe`, { method: 'POST' })
    assert.equal((await sleepApi(other, store, token)).status, 404)
    assert.equal(store.record, undefined)
  })
})
