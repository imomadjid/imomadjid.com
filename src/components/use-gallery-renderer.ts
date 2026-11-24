import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { RefObject } from 'react'

type StartRenderer<T, Tuning> = (
  canvas: HTMLCanvasElement,
  tuning: Tuning,
  signal: AbortSignal,
  onFail: (error: Error) => void,
) => Promise<T>

/**
 * Starts a Gallery WebGPU renderer on `canvasRef` once `nearRef` (the canvas by default) comes
 * within half a screen of the viewport, while `enabled`, and restarts it when `key` changes. It
 * starts with the current `tuning` and gets every later one through `update`. `ready` turns true
 * after the renderer's first frame, so the caller can hide its CSS fallback without a flash, and
 * false again if the renderer fails, restarts or is disabled; `failed` is true from a failure
 * until it restarts.
 */
export function useGalleryRenderer<T extends { update: (tuning: Tuning) => void }, Tuning>(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  key: string,
  tuning: Tuning,
  start: StartRenderer<T, Tuning>,
  nearRef: RefObject<Element | null> = canvasRef,
  enabled = true,
) {
  const rendererRef = useRef<T | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const startRenderer = useEffectEvent(
    (canvas: HTMLCanvasElement, signal: AbortSignal, onFail: (error: Error) => void) =>
      start(canvas, tuning, signal, onFail),
  )
  // Tuning that changed while the renderer was starting.
  const catchUp = useEffectEvent((renderer: T) => renderer.update(tuning))

  useEffect(() => {
    rendererRef.current?.update(tuning)
  }, [tuning])

  useEffect(() => {
    const canvas = canvasRef.current
    const near = nearRef.current
    if (!enabled || !canvas || !near || !('gpu' in navigator)) return
    const abort = new AbortController()
    const fallBack = (error: Error) => {
      rendererRef.current = null
      setReady(false)
      setFailed(true)
      console.warn('The Gallery is using its CSS fallback:', error)
    }
    const begin = () => {
      startRenderer(canvas, abort.signal, fallBack)
        .then((renderer) => {
          // A start that finished after cleanup has already disposed itself.
          if (abort.signal.aborted) return
          rendererRef.current = renderer
          catchUp(renderer)
          // The renderer draws its first frame in the next animation frame, before this callback.
          // One that failed in between has cleared the ref and must not hide the fallback.
          requestAnimationFrame(() => {
            if (!abort.signal.aborted && rendererRef.current === renderer) setReady(true)
          })
        })
        .catch((error) => {
          if (!abort.signal.aborted)
            fallBack(error instanceof Error ? error : new Error(String(error)))
        })
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        begin()
      },
      { rootMargin: '50% 0px' },
    )
    observer.observe(near)
    return () => {
      observer.disconnect()
      abort.abort()
      rendererRef.current = null
      // Bring the CSS fallback back until a restarted renderer draws.
      setReady(false)
      setFailed(false)
    }
  }, [canvasRef, nearRef, key, enabled])

  return { rendererRef, ready, failed }
}
