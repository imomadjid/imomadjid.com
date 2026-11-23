import { useEffect, useRef } from 'react'

import type { AmbientRenderer } from '#/lib/ambient-light'
import type { AmbientSettings } from '#/lib/ambient-settings'

// The backdrop and the light share their geometry; they can't share a wrapper, which would form a
// stacking context and hold the light under the content.
const VIEWPORT_LAYER = 'pointer-events-none fixed inset-x-0 top-0 h-lvh'

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

  // The light comes through a window in the room, so it stays put while the page scrolls past;
  // the large viewport height keeps it from resizing as mobile toolbars collapse. With lit content
  // it lies over the page as a hard-light layer (see AGENTS.md). The backdrop paints the plain
  // wall it is encoded against under all of it, wherever the page ends, and falls back to the
  // surface token without the renderer. The canvas paints the token for the renderer to read.
  return (
    <>
      <div ref={backdropRef} aria-hidden="true" className={`${VIEWPORT_LAYER} -z-1 bg-surface-1`} />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-lit-content={settings.content.lit ? '' : undefined}
        className={`${VIEWPORT_LAYER} -z-1 w-full bg-surface-1 opacity-0 data-lit-content:z-20 data-lit-content:mix-blend-hard-light data-[renderer=webgpu]:opacity-100 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]`}
      />
    </>
  )
}
