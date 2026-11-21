import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'

import { normalizeSurfaceLevel, surfaceClasses } from '#/lib/surface-classes'
import { SurfaceProvider, useSurface } from '#/lib/surface-context'

// A card that trails the mouse while it rests on a target, as the Krillion Bench chart's
// tooltips do. It sits below and to the right of the pointer, and flips to the other side of
// it wherever that would run past the window's edge.
const OPEN_DELAY = 350
const GAP_X = 14
const GAP_Y = 18
const EDGE = 8
// How quickly the card catches up with the pointer, per second.
const FOLLOW_RATE = 22
// Matches the fade out, after which the card unmounts.
const CLOSE_DURATION = 150

type Point = { x: number; y: number }

/**
 * Follows the mouse over `target` after a short rest, so brushing past does not open it.
 * Pressing hides it until the button comes back up. A `disabled` card only opens on the
 * next rest after it is enabled.
 */
export function CursorTooltip({
  target,
  disabled = false,
  children,
}: {
  target: RefObject<SVGElement | null>
  /** Keeps the card closed, as while another hint is showing. */
  disabled?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const pointer = useRef<Point>({ x: 0, y: 0 })
  const level = normalizeSurfaceLevel(useSurface() + 2)
  const blocked = useRef(disabled)

  useEffect(() => {
    blocked.current = disabled
  }, [disabled])

  useEffect(() => {
    const element = target.current
    if (!element) return
    const listeners = new AbortController()
    const options = { signal: listeners.signal }
    let timer: ReturnType<typeof setTimeout> | undefined
    let unmount: ReturnType<typeof setTimeout> | undefined
    let inside = false
    let pressed = false
    const track = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (!inside || pressed || blocked.current) return
        clearTimeout(unmount)
        setMounted(true)
        setOpen(true)
      }, OPEN_DELAY)
    }
    const close = () => {
      clearTimeout(timer)
      setOpen(false)
      // Unmounts once the fade out has finished.
      clearTimeout(unmount)
      unmount = setTimeout(() => setMounted(false), CLOSE_DURATION)
    }
    element.addEventListener(
      'pointerenter',
      (event) => {
        if (event.pointerType !== 'mouse') return
        inside = true
        track(event)
        arm()
      },
      options,
    )
    element.addEventListener('pointermove', track, options)
    element.addEventListener(
      'pointerleave',
      () => {
        inside = false
        close()
      },
      options,
    )
    element.addEventListener(
      'pointerdown',
      () => {
        pressed = true
        close()
      },
      options,
    )
    // Released over the target, the card comes back with what the press changed.
    window.addEventListener(
      'pointerup',
      () => {
        pressed = false
        if (inside) arm()
      },
      options,
    )
    return () => {
      listeners.abort()
      clearTimeout(timer)
      clearTimeout(unmount)
    }
  }, [target])

  // Placement runs per frame, outside React, so following the pointer never re-renders. The
  // first placement happens before paint, so the card never shows at the window's corner.
  useLayoutEffect(() => {
    const element = card.current
    if (!mounted || !element) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let last = 0
    let current: Point | null = null
    const place = (now: number) => {
      const width = element.offsetWidth
      const height = element.offsetHeight
      const { x, y } = pointer.current
      const right = x + GAP_X + width <= window.innerWidth - EDGE
      const below = y + GAP_Y + height <= window.innerHeight - EDGE
      const goal = {
        x: clamp(right ? x + GAP_X : x - GAP_X - width, EDGE, window.innerWidth - EDGE - width),
        y: clamp(below ? y + GAP_Y : y - GAP_Y - height, EDGE, window.innerHeight - EDGE - height),
      }
      const time = now || performance.now()
      const delta = last ? Math.min((time - last) / 1000, 0.05) : 0
      last = time
      const ease = still ? 1 : 1 - Math.exp(-delta * FOLLOW_RATE)
      current = current
        ? { x: current.x + (goal.x - current.x) * ease, y: current.y + (goal.y - current.y) * ease }
        : goal
      element.style.translate = `${current.x.toFixed(2)}px ${current.y.toFixed(2)}px`
      // The card grows out of the corner nearest the pointer.
      element.style.transformOrigin = `${right ? 'left' : 'right'} ${below ? 'top' : 'bottom'}`
      frame = requestAnimationFrame(place)
    }
    place(0)
    return () => cancelAnimationFrame(frame)
  }, [mounted])

  if (!mounted) return null
  return createPortal(
    <div
      ref={card}
      aria-hidden="true"
      data-open={open ? '' : undefined}
      className={`pointer-events-none fixed top-0 left-0 z-(--z-tooltip) w-max max-w-64 scale-96 rounded-[20px] border border-border px-4 py-3.5 opacity-0 transition-[opacity,scale] duration-150 ease-out select-none data-open:scale-100 data-open:opacity-100 motion-reduce:transition-none starting:data-open:scale-96 starting:data-open:opacity-0 ${surfaceClasses(level)}`}
    >
      <SurfaceProvider value={level}>{children}</SurfaceProvider>
    </div>,
    document.body,
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
