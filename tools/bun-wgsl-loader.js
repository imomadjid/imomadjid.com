// fallow-ignore-file unused-file -- loaded by bunfig.toml test preload
// Loads .wgsl imports in Bun tests with the same transform Vite uses.
import { plugin } from 'bun'
import { wgslVitePlugin } from 'vgpu/client'

const wgsl = wgslVitePlugin()
const context = { addWatchFile() {} }

void plugin({
  name: 'wgsl',
  setup(build) {
    build.onLoad({ filter: /\.wgsl$/ }, async ({ path }) => {
      const result = await wgsl.transform.call(context, await Bun.file(path).text(), path)
      return { contents: result?.code ?? '', loader: 'js' }
    })
  },
})
