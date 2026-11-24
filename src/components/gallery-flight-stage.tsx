import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'

import { useGalleryRenderer } from '#/components/use-gallery-renderer'
import type { Flight, FlightTuning } from '#/lib/gallery-flight'
import { cn } from '#/lib/utils'

// The body to portal into, once hydrated.
const subscribeNever = () => () => {}
const clientBody = () => document.body
const serverBody = () => null

export type FlightStage = {
  /** The renderer, once it has started; null before then and without WebGPU. */
  flightRef: RefObject<Flight | null>
  /** True once the renderer draws; false without WebGPU, where views fade in by themselves. */
  ready: boolean
  /** Whether a flight shows on the canvas, above everything in the dialogs. */
  airborne: boolean
  /** Shows the canvas, for a flight that has drawn its first frame. */
  show: () => void
  /**
   * Hides the canvas once a flight hands over to the page. One that `relight`s fades out over
   * the lit tile beneath instead, then clears.
   */
  hide: (relight: boolean) => void
  /** The canvas, portalled to the body. */
  canvas: ReactNode
}

/**
 * The canvas the Gallery's flights are drawn on, over the whole viewport and above its dialogs,
 * shared by the lightbox's photo and the See more overlay's cells. The renderer starts as
 * `nearRef` nears the viewport (src/components/use-gallery-renderer.ts).
 *
 * The canvas shows only while a flight is airborne; the view it lands in takes over in the same
 * commit that hides it. A flight landing back on the page fades out instead: the canvas above the
 * page is unlit, and the tile beneath is lit by the Sunlit layer, so the fade brings its light and
 * shadows in rather than snapping them on. Then the last frame can go.
 */
export function useFlightStage(
  tuning: FlightTuning,
  nearRef: RefObject<Element | null>,
): FlightStage {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const body = useSyncExternalStore(subscribeNever, clientBody, serverBody)
  const [visible, setVisible] = useState(false)
  const [relighting, setRelighting] = useState(false)

  const { rendererRef: flightRef, ready } = useGalleryRenderer<Flight, FlightTuning>(
    canvasRef,
    // The canvas only exists once hydrated, in a portal.
    body ? 'flight' : 'server',
    tuning,
    async (canvas, initialTuning, signal, onFail) => {
      const { startGalleryFlight } = await import('#/lib/gallery-flight')
      return startGalleryFlight(canvas, initialTuning, signal, onFail)
    },
    nearRef,
  )

  useEffect(() => {
    if (!relighting) return
    const timer = setTimeout(() => setRelighting(false), tuning.relight * 1000)
    return () => clearTimeout(timer)
  }, [relighting, tuning.relight])
  useEffect(() => {
    if (!visible && !relighting) flightRef.current?.clear()
  }, [visible, relighting, flightRef])

  const show = () => {
    setVisible(true)
    setRelighting(false)
  }
  const hide = (relight: boolean) => {
    setVisible(false)
    setRelighting(relight && tuning.relight > 0)
  }

  const canvas =
    body &&
    createPortal(
      // Above the dialogs (z-50) and below tooltips (z-70); it never takes the pointer.
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          'pointer-events-none fixed inset-0 z-60 size-full',
          !visible && !relighting && 'invisible',
          // Only while fading, so a new flight shows at once.
          relighting && 'opacity-0 transition-opacity ease-out motion-reduce:transition-none',
        )}
        style={relighting ? { transitionDuration: `${tuning.relight}s` } : undefined}
      />,
      body,
    )

  return { flightRef, ready, airborne: visible, show, hide, canvas }
}
