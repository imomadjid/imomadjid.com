import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { effect, frame, init, sampler, target } from 'vgpu/node'

import surfaceSource from './ambient-surface.wgsl'

type SurfaceParams = {
  surfaceColor: number[]
  night: number
  intensity: number
  warmth: number
  direction: number
  entranceDawn: number
  entranceDusk: number
  overlay: number
}

/** Renders the material shader into one pixel from a one-pixel lighting texture. */
async function surfaceShader(params: SurfaceParams) {
  const gpu = await init()
  const lighting = gpu.gpu.createTexture({
    size: [1, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  })
  const shader = effect(gpu, surfaceSource, {
    set: {
      params,
      lighting,
      linearSampler: sampler(gpu, { minFilter: 'linear', magFilter: 'linear' }),
    },
  })
  const output = target(gpu, { size: [1, 1], format: 'rgba16float' })
  await shader.compile({ colors: [output.format] })
  return {
    gpu,
    /** Sets the lighting texel: visibility and irradiance, as 8-bit levels. */
    light: (visibility: number, irradiance: number) => {
      gpu.gpu.queue.writeTexture(
        { texture: lighting },
        new Uint8Array([visibility, irradiance, 0, 255]),
        { bytesPerRow: 4 },
        [1, 1],
      )
    },
    render: async () => {
      shader.set({ params })
      frame(gpu, (current) => {
        current.pass({ target: output }, (pass) => pass.draw(shader))
      })
      const pixels = await output.color.readFloats({ mipLevel: 0, region: 'all' })
      return Array.from(pixels.slice(0, 3))
    },
  }
}

void test('zero light intensity preserves the surface throughout theme transitions', async () => {
  const params: SurfaceParams = {
    surfaceColor: [250 / 255, 250 / 255, 250 / 255],
    night: 0,
    intensity: 0,
    warmth: 0.55,
    direction: 0,
    entranceDawn: 0,
    entranceDusk: 0,
    overlay: 0,
  }
  const { gpu, light, render } = await surfaceShader(params)
  try {
    light(255, 255)
    for (const channel of [23 / 255, 0.5, 250 / 255]) {
      for (const night of [0, 0.25, 0.5, 0.75, 1]) {
        for (const direction of [0, 0.5, 1]) {
          Object.assign(params, { surfaceColor: [channel, channel, channel], night, direction })
          for (const actual of await render()) {
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

// CSS hard-light in sRGB, per channel: multiply by 2s below 0.5, screen with 2s - 1 above it.
const hardLight = (backdrop: number, source: number) =>
  source <= 0.5 ? backdrop * 2 * source : backdrop + (2 * source - 1) - backdrop * (2 * source - 1)

void test('the overlay over the plain surface reproduces the lit wall', async () => {
  const params: SurfaceParams = {
    surfaceColor: [0, 0, 0],
    night: 0,
    intensity: 0.7,
    warmth: 0.55,
    direction: 0,
    entranceDawn: 0,
    entranceDusk: 0,
    overlay: 0,
  }
  const { gpu, light, render } = await surfaceShader(params)
  try {
    let brightened = 0
    let darkened = 0
    // Shade and sun, by day, at the sunset glow, and by night, on light and dark surfaces.
    for (const visibility of [0, 128, 255]) {
      light(visibility, 255)
      for (const [night, surface] of [
        [0, 250 / 255],
        [0.3, 200 / 255],
        [1, 23 / 255],
      ] as const) {
        Object.assign(params, {
          night,
          direction: night > 0 ? 1 : 0,
          surfaceColor: [surface, surface, surface],
          overlay: 0,
        })
        const wall = await render()
        params.overlay = 1
        const encoded = await render()
        for (const [index, expected] of wall.entries()) {
          const actual = hardLight(surface, encoded[index] ?? 0.5)
          if (expected > surface + 0.002) brightened += 1
          if (expected < surface - 0.002) darkened += 1
          assert.ok(
            Math.abs(actual - expected) < 1.5 / 255,
            `visibility ${visibility}, phase ${night}, channel ${index}: wall ${expected}, overlay gives ${actual}`,
          )
        }
      }
    }
    assert.ok(brightened > 0 && darkened > 0, 'both the multiply and screen branches ran')
  } finally {
    gpu.dispose()
  }
})
