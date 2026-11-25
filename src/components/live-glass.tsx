import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'

import { glassPressScale, glassPressTint } from '#/lib/glass'
import { LIVE_GLASS_MARGIN } from '#/lib/live-glass-source'
import type { LiveGlassSource } from '#/lib/live-glass-source'
import { useMediaQuery } from '#/lib/media-query'
import { cn } from '#/lib/utils'

const LiveGlassSourceContext = createContext<LiveGlassSource | null>(null)

/** Tells live glass inside it what lies behind it (#/lib/live-glass). */
export function LiveGlassSourceProvider({
  source,
  children,
}: {
  source: LiveGlassSource
  children: ReactNode
}) {
  return <LiveGlassSourceContext value={source}>{children}</LiveGlassSourceContext>
}

/**
 * Sets `--live-glass-press` on the canvas to the scale that pulls its control's glass in 1px per
 * side, which depends on the control's size, and keeps it as that size changes, while the canvas
 * is `mounted`.
 */
function usePressScale(canvasRef: RefObject<HTMLCanvasElement | null>, mounted: boolean) {
  useEffect(() => {
    const canvas = canvasRef.current
    const control = canvas?.parentElement
    if (!canvas || !control) return
    const observer = new ResizeObserver(() => {
      const width = control.clientWidth
      if (width > 2) canvas.style.setProperty('--live-glass-press', String((width - 2) / width))
    })
    observer.observe(control)
    return () => observer.disconnect()
  }, [canvasRef, mounted])
}

/**
 * Live glass for a glass control: a WebGPU canvas over its parent (a `group` with rounded
 * corners) and LIVE_GLASS_MARGIN around it for the shadow. `fallback` is the static glass layer:
 * it shows until the first frame, and wherever live glass can't run (no WebGPU, no source above,
 * reduced transparency) or fails.
 */
export function LiveGlassLayer({ fallback }: { fallback: ReactNode }) {
  const source = useContext(LiveGlassSourceContext)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<'idle' | 'live' | 'failed'>('idle')
  const reduced = useMediaQuery('(prefers-reduced-transparency: reduce)')
  const drawn = source !== null && !reduced
  usePressScale(canvasRef, drawn && state !== 'failed')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !source || reduced || !('gpu' in navigator)) return
    const controller = new AbortController()
    const fail = (error: Error) => {
      if (controller.signal.aborted) return
      console.warn('Live glass fell back to static glass:', error)
      setState('failed')
    }
    const radius = () => {
      const element = canvas.parentElement
      return element ? Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0 : 0
    }
    const start = async () => {
      try {
        const { startLiveGlass } = await import('#/lib/live-glass')
        // Live once a frame is on the canvas; until then the static glass shows.
        await startLiveGlass(canvas, source, radius, controller.signal, fail, () => {
          if (!controller.signal.aborted) setState('live')
        })
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)))
      }
    }
    void start()
    return () => {
      controller.abort()
      setState('idle')
    }
  }, [source, reduced])

  return (
    <>
      {state !== 'live' && fallback}
      {drawn && state !== 'failed' && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -z-10',
            // Pressed, the glass pulls in 1px per side as static glass's surface does
            // (#/lib/glass), at its timing; the renderer draws it at the scaled size.
            glassPressScale,
            'group-active:scale-(--live-glass-press) motion-reduce:transition-none',
            state === 'live' ? 'opacity-100' : 'opacity-0',
          )}
          // An explicit size: a canvas sized by its insets alone takes its backing store's size,
          // which the surface sets from the CSS size, and grows without end.
          style={{
            left: -LIVE_GLASS_MARGIN,
            top: -LIVE_GLASS_MARGIN,
            width: `calc(100% + ${2 * LIVE_GLASS_MARGIN}px)`,
            height: `calc(100% + ${2 * LIVE_GLASS_MARGIN}px)`,
          }}
        />
      )}
      {/* Hover and press tint over the live glass, as static glass draws them. */}
      {state === 'live' && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 -z-10 rounded-[inherit] group-hover:bg-hover group-active:bg-active',
            glassPressTint,
          )}
        />
      )}
    </>
  )
}
