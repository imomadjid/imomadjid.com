import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export type StartRenderer<T> = (
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  onFail: (error: Error) => void,
) => Promise<T>

/**
 * Starts a Gallery WebGPU renderer on `canvasRef` once `nearRef` (the canvas by default) comes
 * within half a screen of the viewport, and restarts it when `key` changes. `ready` turns true
 * after the renderer's first frame, so the caller can hide its CSS fallback without a flash, and
 * false again if the renderer fails.
 */
export function useGalleryRenderer<T>(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  key: string,
  start: StartRenderer<T>,
  nearRef: RefObject<Element | null> = canvasRef,
) {
  const rendererRef = useRef<T | null>(null)
  const [ready, setReady] = useState(false)
  const startRef = useRef(start)
  useEffect(() => {
    startRef.current = start
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const near = nearRef.current
    if (!canvas || !near || !('gpu' in navigator)) return
    const abort = new AbortController()
    const fallBack = (error: Error) => {
      rendererRef.current = null
      setReady(false)
      console.warn('The Gallery is using its CSS fallback:', error)
    }
    const begin = () => {
      startRef
        .current(canvas, abort.signal, fallBack)
        .then((renderer) => {
          rendererRef.current = renderer
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
    }
  }, [canvasRef, nearRef, key])

  return { rendererRef, ready }
}
