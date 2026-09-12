import { useEffect, useRef } from 'react'

import type { AmbientRenderer } from '#/lib/ambient-light'
import type { AmbientSettings } from '#/lib/ambient-settings'

export function AmbientLight({ settings }: { settings: AmbientSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<AmbientRenderer | null>(null)
  const latest = useRef(settings)

  useEffect(() => {
    latest.current = settings
    renderer.current?.update(settings)
  }, [settings])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const abort = new AbortController()
    void import('#/lib/ambient-light')
      .then(({ startAmbient }) => startAmbient(canvas, host, latest.current, abort.signal))
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

  return <canvas ref={canvasRef} aria-hidden="true" className="sunlit-canvas" />
}
