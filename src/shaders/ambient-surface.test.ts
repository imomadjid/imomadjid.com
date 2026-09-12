import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { effect, frame, init, sampler, target } from 'vgpu/node'

void test('zero light intensity preserves the surface throughout theme transitions', async () => {
  const gpu = await init()
  try {
    const lighting = gpu.gpu.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })
    gpu.gpu.queue.writeTexture(
      { texture: lighting },
      new Uint8Array([255, 255, 0, 255]),
      { bytesPerRow: 4 },
      [1, 1],
    )
    const params = {
      surfaceColor: [250 / 255, 250 / 255, 250 / 255],
      night: 0,
      intensity: 0,
      warmth: 0.55,
      direction: 0,
      entranceDawn: 0,
      entranceDusk: 0,
    }
    const shader = effect(
      gpu,
      readFileSync(new URL('./ambient-surface.wgsl', import.meta.url), 'utf8'),
      {
        set: {
          params,
          lighting,
          linearSampler: sampler(gpu, { minFilter: 'linear', magFilter: 'linear' }),
        },
      },
    )
    const output = target(gpu, { size: [1, 1], format: 'rgba16float' })
    await shader.compile({ colors: [output.format] })
    for (const channel of [23 / 255, 0.5, 250 / 255]) {
      for (const night of [0, 0.25, 0.5, 0.75, 1]) {
        for (const direction of [0, 0.5, 1]) {
          Object.assign(params, { surfaceColor: [channel, channel, channel], night, direction })
          shader.set({ params })
          frame(gpu, (current) => {
            current.pass({ target: output }, (pass) => pass.draw(shader))
          })
          const pixels = await output.readFloats()
          for (const actual of pixels.slice(0, 3)) {
            assert.ok(
              Math.abs(actual - channel) < 0.001,
              `surface ${channel}, phase ${night}, direction ${direction}: received ${actual}`,
            )
          }
        }
      }
    }
  } finally {
    gpu.dispose()
  }
})
