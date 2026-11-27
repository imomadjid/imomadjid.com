import assert from 'node:assert/strict'
import { test } from 'node:test'

import { webGpuRuns } from './webgpu-probe'
import type { GpuEntry } from './webgpu-probe'

// Just enough of WebGPU's API for the probe to walk.
const fakeGpu = (requestAdapter: GpuEntry['requestAdapter']): GpuEntry => ({ requestAdapter })

const never = () => new Promise<never>(() => {})

void test('WebGPU runs only where an adapter gives a device', async () => {
  let destroyed = false
  const device = {
    destroy: () => {
      destroyed = true
    },
  }
  const works = fakeGpu(async () => ({ requestDevice: async () => device }))
  assert.equal(await webGpuRuns(works), true)
  assert.ok(destroyed, 'the probe gives its device back')

  assert.equal(await webGpuRuns(undefined), false, 'no navigator.gpu')
  assert.equal(await webGpuRuns(fakeGpu(async () => null)), false, 'no adapter')
  assert.equal(
    await webGpuRuns(fakeGpu(() => Promise.reject(new Error('blocked')))),
    false,
    'the adapter request throws',
  )
  const refuses = fakeGpu(async () => ({
    requestDevice: () => Promise.reject(new Error('lost')),
  }))
  assert.equal(await webGpuRuns(refuses), false, 'the adapter refuses its device')
})

void test('a probe that never answers counts as no', async () => {
  assert.equal(await webGpuRuns(fakeGpu(never), 20), false, 'the adapter never comes')
  assert.equal(
    await webGpuRuns(
      fakeGpu(async () => ({ requestDevice: never })),
      20,
    ),
    false,
    'the device never comes',
  )
})
