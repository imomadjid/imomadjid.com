import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// "thanks for visiting!" written beside the visitor's own stamp at the top of the postmark
// footer's pile, off its top right edge, in the hand and ink of the blind wand's note
// (src/components/wand-hint.tsx). It writes itself in the first time the pile comes into view,
// once its font has loaded, and stays. The hand's font is cut to lowercase (src/styles.css), so
// the words are too.
const TEXT = 'thanks for visiting!'
// How far the words start past the stamp's right edge, and their baseline below its top, in CSS
// pixels, before the stamp's turn.
const GAP = 8
const BASELINE = 0.3

/** The hand's size beside a stamp `stamp` px across: smaller with a phone's smaller stamps. */
function letterSize(stamp: number) {
  return stamp < 124 ? 16 : 20
}

/**
 * How far past the stamp's edge the words reach, beside a stamp `stamp` px across: the pile keeps
 * other stamps out of it (postmark-visits.ts). The words run about 6.5 times the hand's size.
 */
export function thanksReach(stamp: number) {
  return GAP + letterSize(stamp) * 7.5
}

const TILT = -4

const WRITE_DELAY = 300
// About as fast as a pen writes.
const WRITE_TEXT = TEXT.length * 55
const FONT_TIMEOUT = 3000

export function ThanksNote({
  x,
  y,
  width,
  height,
  rotation,
  stamp,
}: {
  // The stamp's centre, and its size and turn.
  x: number
  y: number
  width: number
  height: number
  rotation: number
  // How wide a round stamp shows in the pile, which the hand's size follows.
  stamp: number
}) {
  const ref = useRef<SVGGElement>(null)
  const [writing, setWriting] = useState(false)

  // Waits for the pile to show and for the hand's font, so it never writes in a fallback face.
  useEffect(() => {
    const note = ref.current
    if (!note) return undefined
    let cancelled = false
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      const timeout = new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT))
      void Promise.race([document.fonts.load('500 22px Caveat'), timeout])
        .catch(() => {})
        .then(() => {
          if (!cancelled) setWriting(true)
        })
    })
    observer.observe(note)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [])

  // Before paint, so the note never flashes fully written before it starts writing.
  useLayoutEffect(() => {
    const text = ref.current?.querySelector('text')
    if (!text || !writing) return undefined
    const animation = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? text.animate([{ opacity: 0 }, { opacity: 1 }], {
          delay: WRITE_DELAY,
          duration: 300,
          fill: 'backwards',
        })
      : // Writing runs left to right at an even pace, like a pen.
        text.animate(
          [{ clipPath: 'inset(-30% 100% -30% 0)' }, { clipPath: 'inset(-30% 0 -30% 0)' }],
          {
            delay: WRITE_DELAY,
            duration: WRITE_TEXT,
            easing: 'cubic-bezier(0.3, 0.1, 0.6, 1)',
            fill: 'backwards',
          },
        )
    return () => animation.cancel()
  }, [writing])

  const left = width / 2 + GAP
  const letter = letterSize(stamp)
  const baseline = -height / 2 + height * BASELINE
  return (
    <g
      ref={ref}
      transform={`translate(${x} ${y}) rotate(${rotation.toFixed(1)})`}
      className="pointer-events-none text-neutral-500 select-none dark:text-neutral-400"
    >
      {/* What the pile watches for coming into view, before the words are there. */}
      <rect
        x={left}
        y={baseline - letter}
        width={thanksReach(stamp) - GAP}
        height={letter * 1.3}
        fill="none"
      />
      {writing && (
        <text
          x={left}
          y={baseline}
          fill="currentColor"
          fontSize={letter}
          className="font-hand"
          transform={`rotate(${TILT} ${left} ${baseline})`}
        >
          {TEXT}
        </text>
      )}
    </g>
  )
}
