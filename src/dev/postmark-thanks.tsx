import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { handFontReady } from '#/lib/hand-font'

// "thanks for visiting!" written beside the visitor's own stamp at the top of the postmark
// footer's pile, off its top right edge, in the hand and ink of the blind wand's note
// (src/components/wand-hint.tsx). It writes itself in once the pile says to, after the stamps
// have landed, and once its font has loaded, and stays. The hand's font is cut to lowercase (src/styles.css), so
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
 * other stamps out of it (postmark-visits.ts). The words run about 7.5 times the hand's size.
 */
export function thanksReach(stamp: number) {
  return GAP + letterSize(stamp) * 7.5
}

const TILT = -4

// How long a note that shows up late waits for its stamp to land.
const LATE_WRITE = 300
// About as fast as a pen writes.
const WRITE_TEXT = TEXT.length * 55

export function ThanksNote({
  x,
  y,
  width,
  height,
  rotation,
  stamp,
  writeFrom,
}: {
  // The stamp's centre, and its size and turn.
  x: number
  y: number
  width: number
  height: number
  rotation: number
  // How wide a round stamp shows in the pile, which the hand's size follows.
  stamp: number
  // When it starts writing, in the page's clock (performance.now()): once the pile's stamps have
  // landed. Until the pile is reached, undefined.
  writeFrom: number | undefined
}) {
  const textRef = useRef<SVGTextElement>(null)
  // When it does start writing, once its font is in.
  const [writeAt, setWriteAt] = useState<number>()

  // Waits for the hand's font too, so it never writes in a fallback face. A note that shows up
  // after its time, beside a stamp that lands late, waits for that stamp to land first.
  useEffect(() => {
    if (writeFrom === undefined) return undefined
    const at = Math.max(writeFrom, performance.now() + LATE_WRITE)
    let cancelled = false
    void handFontReady().then(() => {
      if (!cancelled) setWriteAt(at)
    })
    return () => {
      cancelled = true
    }
  }, [writeFrom])
  const writing = writeAt !== undefined

  // Before paint, so the note never flashes fully written before it starts writing.
  useLayoutEffect(() => {
    const text = textRef.current
    if (!text || writeAt === undefined) return undefined
    const delay = Math.max(0, writeAt - performance.now())
    const animation = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? text.animate([{ opacity: 0 }, { opacity: 1 }], {
          delay,
          duration: 300,
          fill: 'backwards',
        })
      : // Writing runs left to right at an even pace, like a pen.
        text.animate(
          [{ clipPath: 'inset(-30% 100% -30% 0)' }, { clipPath: 'inset(-30% 0 -30% 0)' }],
          {
            delay,
            duration: WRITE_TEXT,
            easing: 'cubic-bezier(0.3, 0.1, 0.6, 1)',
            fill: 'backwards',
          },
        )
    return () => animation.cancel()
  }, [writeAt])

  const left = width / 2 + GAP
  const letter = letterSize(stamp)
  const baseline = -height / 2 + height * BASELINE
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotation.toFixed(1)})`}
      className="pointer-events-none text-neutral-500 select-none dark:text-neutral-400"
    >
      {writing && (
        <text
          ref={textRef}
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
