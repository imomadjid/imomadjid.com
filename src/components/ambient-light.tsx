import { useEffect, useRef } from 'react'

import type { AmbientRenderer } from '#/lib/ambient-light'
import type { AmbientSettings } from '#/lib/ambient-settings'

export function AmbientLight({ settings }: { settings: AmbientSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const renderer = useRef<AmbientRenderer | null>(null)
  const latest = useRef(settings)

  useEffect(() => {
    latest.current = settings
    renderer.current?.update(settings)
  }, [settings])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const backdrop = backdropRef.current
    if (!canvas || !host || !backdrop) return
    // Skip downloading the renderer where WebGPU cannot run.
    if (!('gpu' in navigator)) {
      canvas.dataset.renderer = 'fallback'
      return
    }
    const abort = new AbortController()
    void import('#/lib/ambient-light')
      .then(({ startAmbient }) =>
        startAmbient(canvas, host, backdrop, latest.current, abort.signal),
      )
      .then((instance) => {
        if (abort.signal.aborted) instance.dispose()
        else {
          renderer.current = instance
          instance.update(latest.current)
        }
      })
      .catch((error) => {
        if (abort.signal.aborted) return
        canvas.dataset.renderer = 'fallback'
        console.warn('Sunlit is using its static background:', error)
      })
    return () => {
      abort.abort()
      delete canvas.dataset.renderer
      delete host.dataset.sceneTone
      renderer.current = null
    }
  }, [])

  // The canvas paints the surface token so the renderer can read it without a transition.
  // The light comes through a window in the room, so it stays put while the page scrolls past.
  // The large viewport height keeps it from resizing as mobile toolbars collapse.
  // With lit content it lies over the page as a hard-light layer, so text and images take the
  // light as if printed on the wall; only the wand, which hangs in front, stays above it.
  // The light is encoded against the plain wall, so the backdrop paints that wall under the whole
  // canvas, wherever the page ends, in the surface color the renderer is encoding against. Without
  // the renderer it falls back to the surface token, so the layer can still fade out over it.
  return (
    <>
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-1 h-lvh bg-surface-1"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-lit-content={settings.content.lit ? '' : undefined}
        className="pointer-events-none fixed inset-x-0 top-0 -z-1 h-lvh w-full bg-surface-1 opacity-0 data-lit-content:z-20 data-lit-content:mix-blend-hard-light data-[renderer=webgpu]:opacity-100 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]"
      />
    </>
  )
}
