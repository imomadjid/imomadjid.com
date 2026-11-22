import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'

import { glassSurface } from '#/lib/glass'

// A static-glass label that trails the mouse while it rests on a target. It sits below and to
// the right of the pointer, and flips to the other side of it wherever that would run past the
// window's edge. Reached with the keyboard, it sits beside the focus ring instead.
const OPEN_DELAY = 350
const GAP_X = 14
const GAP_Y = 18
const EDGE = 8
// From the focus ring to the card, and how far above the ring's end the card centers.
const FOCUS_GAP = 8
const FOCUS_RISE = 24
// How quickly the card catches up with the pointer, per second.
const FOLLOW_RATE = 22
// Matches the fade out, after which the card unmounts.
const CLOSE_DURATION = 150

type Point = { x: number; y: number }

/**
 * Follows the mouse over `target` after a short rest, so brushing past does not open it.
 * Pressing hides it until the button comes back up. When `focusTarget` gets keyboard focus,
 * it opens beside `focusAnchor` at once and follows it until focus leaves or Escape is
 * pressed. A `disabled` card only opens on the next rest or focus after it is enabled.
 */
export function CursorTooltip({
  target,
  focusTarget,
  focusAnchor,
  disabled = false,
  children,
}: {
  target: RefObject<SVGElement | null>
  focusTarget?: RefObject<HTMLElement | null>
  /** What the card sits beside while focused: the target's focus ring. */
  focusAnchor?: RefObject<Element | null>
  /** Keeps the card closed, as while another hint is showing. */
  disabled?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const pointer = useRef<Point>({ x: 0, y: 0 })
  // Whether keyboard focus opened the card, so it sits beside the anchor, not the pointer.
  const focused = useRef(false)
  const blocked = useRef(disabled)

  useEffect(() => {
    blocked.current = disabled
  }, [disabled])

  useEffect(() => {
    const element = target.current
    if (!element) return
    const focusElement = focusTarget?.current
    const listeners = new AbortController()
    const options = { signal: listeners.signal }
    let timer: ReturnType<typeof setTimeout> | undefined
    let unmount: ReturnType<typeof setTimeout> | undefined
    let inside = false
    let pressed = false
    const track = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    const show = () => {
      clearTimeout(unmount)
      setMounted(true)
      setOpen(true)
    }
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (!inside || pressed || blocked.current || focused.current) return
        show()
      }, OPEN_DELAY)
    }
    const close = () => {
      clearTimeout(timer)
      focused.current = false
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
        // A card the keyboard opened stays with the focus.
        if (!focused.current) close()
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
    if (focusElement) {
      focusElement.addEventListener(
        'focus',
        () => {
          // A click focuses some buttons too; only keyboard focus shows the card.
          if (blocked.current || !focusElement.matches(':focus-visible')) return
          clearTimeout(timer)
          focused.current = true
          show()
        },
        options,
      )
      focusElement.addEventListener('blur', close, options)
      // Escape dismisses the card without moving focus, until focus next arrives.
      focusElement.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Escape' && focused.current) close()
        },
        options,
      )
    }
    return () => {
      listeners.abort()
      clearTimeout(timer)
      clearTimeout(unmount)
    }
  }, [target, focusTarget])

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
      const anchor = focused.current ? focusAnchor?.current?.getBoundingClientRect() : null
      let goal: Point
      let origin: string
      if (anchor) {
        // Left of the ring, near its lower end, or right of it where the left is short of room.
        const left = anchor.left - FOCUS_GAP - width >= EDGE
        goal = {
          x: clamp(
            left ? anchor.left - FOCUS_GAP - width : anchor.right + FOCUS_GAP,
            EDGE,
            window.innerWidth - EDGE - width,
          ),
          y: clamp(
            anchor.bottom - FOCUS_RISE - height / 2,
            EDGE,
            window.innerHeight - EDGE - height,
          ),
        }
        origin = `${left ? 'right' : 'left'} center`
      } else {
        const { x, y } = pointer.current
        const right = x + GAP_X + width <= window.innerWidth - EDGE
        const below = y + GAP_Y + height <= window.innerHeight - EDGE
        goal = {
          x: clamp(right ? x + GAP_X : x - GAP_X - width, EDGE, window.innerWidth - EDGE - width),
          y: clamp(
            below ? y + GAP_Y : y - GAP_Y - height,
            EDGE,
            window.innerHeight - EDGE - height,
          ),
        }
        // The card grows out of the corner nearest the pointer.
        origin = `${right ? 'left' : 'right'} ${below ? 'top' : 'bottom'}`
      }
      const time = now || performance.now()
      const delta = last ? Math.min((time - last) / 1000, 0.05) : 0
      last = time
      // Beside the ring, the card moves with the wand rather than easing after it.
      const ease = still || anchor ? 1 : 1 - Math.exp(-delta * FOLLOW_RATE)
      current = current
        ? { x: current.x + (goal.x - current.x) * ease, y: current.y + (goal.y - current.y) * ease }
        : goal
      element.style.translate = `${current.x.toFixed(2)}px ${current.y.toFixed(2)}px`
      element.style.transformOrigin = origin
      frame = requestAnimationFrame(place)
    }
    place(0)
    return () => cancelAnimationFrame(frame)
  }, [mounted, focusAnchor])

  if (!mounted) return null
  return createPortal(
    <div
      ref={card}
      aria-hidden="true"
      data-open={open ? '' : undefined}
      className="pointer-events-none fixed top-0 left-0 isolate z-(--z-tooltip) h-6 scale-96 rounded-full px-2 py-1.5 text-micro leading-none whitespace-nowrap text-neutral-800 opacity-0 transition-[opacity,scale] duration-150 ease-out select-none data-open:scale-100 data-open:opacity-100 motion-reduce:transition-none dark:text-neutral-200 starting:data-open:scale-96 starting:data-open:opacity-0"
    >
      <span
        aria-hidden="true"
        className={`absolute -z-10 rounded-[inherit] motion-reduce:transition-none ${glassSurface.loading}`}
      />
      {children}
    </div>,
    document.body,
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
