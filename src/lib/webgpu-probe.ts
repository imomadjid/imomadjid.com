// Whether WebGPU really runs here, as the Gallery's renderers need it: an adapter that gives a
// device. `navigator.gpu` alone isn't enough, since some web views expose it with no adapter, and
// an adapter alone isn't either, since one can refuse its device. A probe that hasn't answered by
// `timeout` counts as no: a web view whose GPU process never answers can't run the Gallery either.

// The part of WebGPU the probe uses; `navigator.gpu` is one, and a test can stand in for it.
export interface GpuEntry {
  requestAdapter(
    options?: GPURequestAdapterOptions,
  ): Promise<{ requestDevice(): Promise<{ destroy(): void }> } | null>
}

export async function webGpuRuns(gpu: GpuEntry | undefined, timeout = 1500): Promise<boolean> {
  if (!gpu) return false
  const probe = (async () => {
    const adapter = await gpu.requestAdapter({ powerPreference: 'low-power' })
    if (!adapter) return false
    const device = await adapter.requestDevice()
    device.destroy()
    return true
  })().catch(() => false)
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<boolean>((resolve) => {
    timer = setTimeout(resolve, timeout, false)
  })
  try {
    return await Promise.race([probe, late])
  } finally {
    clearTimeout(timer)
  }
}
