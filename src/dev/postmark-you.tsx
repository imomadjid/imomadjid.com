import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// "you!" written beside the visitor's own stamp at the top of the postmark footer's pile, with a drawn
// arrow down onto it, in the hand and ink of the blind wand's note (src/components/wand-hint.tsx).
// It writes itself in the first time the pile comes into view, once its font has loaded, and
// stays. The hand's font is cut to lowercase (src/styles.css), so the word is too. Lengths are
// CSS pixels from the top of the stamp's middle; the note sits in the clear space above the pile,
// so it reads over nothing, whatever shape the stamp is.
const TEXT_X = 30
const BASELINE = -26
// Shaft from under the word, round and down onto the stamp, then a quick two-stroke head.
const SHAFT = 'M27 -22 C 17 -22, 8 -17, 5.5 -5'
const HEAD = 'M0.6 -10.4 L5.4 -4.2 L10.6 -9.4'
// The note's box, which the pile watches for coming into view.
const BOX = { x: -4, y: -48, width: 84, height: 50 }

const WRITE_DELAY = 300
const WRITE_TEXT = 420
const WRITE_SHAFT = 380
const WRITE_HEAD = 150
const FONT_TIMEOUT = 3000

export function YouNote({ x, y }: { x: number; y: number }) {
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
    const note = ref.current
    if (!note || !writing) return undefined
    const animations: Animation[] = []
    const play = (selector: string, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      for (const element of note.querySelectorAll(selector)) {
        animations.push(element.animate(keyframes, { fill: 'backwards', ...options }))
      }
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      play('[data-you-ink]', [{ opacity: 0 }, { opacity: 1 }], {
        delay: WRITE_DELAY,
        duration: 300,
      })
    } else {
      // Writing runs left to right at an even pace, like a pen, then the arrow is drawn.
      play(
        '[data-you-text]',
        [{ clipPath: 'inset(-20% 100% -20% 0)' }, { clipPath: 'inset(-20% 0 -20% 0)' }],
        { delay: WRITE_DELAY, duration: WRITE_TEXT, easing: 'cubic-bezier(0.3, 0.1, 0.6, 1)' },
      )
      const shaftDelay = WRITE_DELAY + WRITE_TEXT + 80
      play('[data-you-shaft]', [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        delay: shaftDelay,
        duration: WRITE_SHAFT,
        easing: 'cubic-bezier(0.4, 0, 0.7, 1)',
      })
      play('[data-you-head]', [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        delay: shaftDelay + WRITE_SHAFT + 40,
        duration: WRITE_HEAD,
        easing: 'linear',
      })
    }
    return () => {
      for (const animation of animations) animation.cancel()
    }
  }, [writing])

  return (
    <g
      ref={ref}
      transform={`translate(${x} ${y})`}
      className="pointer-events-none text-neutral-500 select-none dark:text-neutral-400"
    >
      <rect {...BOX} fill="none" />
      {writing && (
        <g data-you-ink>
          <text
            data-you-text
            x={TEXT_X}
            y={BASELINE}
            fill="currentColor"
            className="font-hand text-xl"
            transform={`rotate(-4 ${TEXT_X} ${BASELINE})`}
          >
            you!
          </text>
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path data-you-shaft d={SHAFT} pathLength={1} strokeDasharray="1 1" />
            <path data-you-head d={HEAD} pathLength={1} strokeDasharray="1 1" />
          </g>
        </g>
      )}
    </g>
  )
}
