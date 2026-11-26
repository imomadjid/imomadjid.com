import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { handFontReady } from '#/lib/hand-font'
import type { Scheme } from '#/lib/theme'

// A handwritten note with a drawn arrow pointing at the blind wand. It writes itself in after
// the page entrance and rubs itself out the first time someone grabs or turns the wand.
// Lengths are CSS pixels in the note's own box; the arrowhead stops a few pixels short of the rod,
// a little above its end, on whichever side has room.
const WIDTH = 190
const HEIGHT = 64
const BASELINE = 50
const TEXT_INSET = 40
// Shaft from beside the first word up to the rod, then a quick two-stroke head.
const SHAFT = 'M34 42 C 24 41, 13 32, 7.5 14'
const HEAD = 'M4.2 21 L7.2 13.4 L13.6 18.2'
// An eraser rubs back and forth down the note and back up, drawn into its mask. Each pass
// lifts most of the ink in a streak, and the return pass falls between the first one's
// streaks, so the note goes patchy before it goes; what little is left fades at the end.
const SCRUBS = [
  'M-6 6 L196 -2 L-6 20 L196 12 L-6 34 L196 26 L-6 48 L196 40 L-6 62 L196 54 L-6 76 L196 68',
  'M196 75 L-6 69 L196 61 L-6 55 L196 47 L-6 41 L196 33 L-6 27 L196 19 L-6 13 L196 5 L-6 -1',
]
const SCRUB_STRENGTH = 0.85

const WRITE_DELAY = 900
const WRITE_TEXT = 700
const WRITE_SHAFT = 420
const WRITE_HEAD = 160
const ERASE = 900

export type HintPhase = 'writing' | 'erasing'
const STORAGE_KEY = 'imomadjid:wand-hint'

/**
 * Whether to show the note: once per visitor, until they first grab or turn the wand.
 * The note waits for its font so it never writes itself out in a fallback face.
 */
export function useWandHint() {
  const [phase, setPhase] = useState<HintPhase | null>(null)
  // Whether the note is gone for good: erased on an earlier visit or this one. Nothing it
  // renders depends on this, so reading storage while hydrating is safe.
  const [gone, setGone] = useState(() => !import.meta.env.SSR && readDismissed())
  const dismissed = useRef(false)

  useEffect(() => {
    if (readDismissed()) return
    let cancelled = false
    void handFontReady().then(() => {
      if (!cancelled && !dismissed.current) setPhase('writing')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = useCallback(() => {
    if (dismissed.current) return
    dismissed.current = true
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed')
    } catch {
      // The note still erases for this visit.
    }
    setPhase((current) => (current ? 'erasing' : null))
  }, [])

  const erased = useCallback(() => {
    setPhase(null)
    setGone(true)
  }, [])
  return { phase, gone, dismiss, erased }
}

function readDismissed() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY))
  } catch {
    // Without storage the note shows on each visit until the wand is used.
    return false
  }
}

/** `onErased` runs once the eraser finishes, so the note can unmount. */
export function WandHint({
  scheme,
  phase,
  onErased,
}: {
  scheme: Scheme
  phase: HintPhase
  onErased: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const erased = useRef(onErased)
  const label = `${touchFirst() ? 'tap' : 'click'} for ${scheme === 'dark' ? 'light' : 'dark'} mode`

  useEffect(() => {
    erased.current = onErased
  }, [onErased])

  // Before paint, so the note never flashes fully written before it starts writing.
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || phase !== 'writing') return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animations: Animation[] = []
    const play = (selector: string, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      for (const element of root.querySelectorAll(selector)) {
        animations.push(element.animate(keyframes, { fill: 'backwards', ...options }))
      }
    }
    if (still) {
      play('svg', [{ opacity: 0 }, { opacity: 1 }], { delay: WRITE_DELAY, duration: 300 })
    } else {
      // Writing runs left to right at an even pace, like a pen.
      play(
        '[data-hint-text]',
        [{ clipPath: 'inset(-20% 100% -20% 0)' }, { clipPath: 'inset(-20% 0 -20% 0)' }],
        { delay: WRITE_DELAY, duration: WRITE_TEXT, easing: 'cubic-bezier(0.3, 0.1, 0.6, 1)' },
      )
      const shaftDelay = WRITE_DELAY + WRITE_TEXT + 80
      play('[data-hint-shaft]', [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        delay: shaftDelay,
        duration: WRITE_SHAFT,
        easing: 'cubic-bezier(0.4, 0, 0.7, 1)',
      })
      play('[data-hint-head]', [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        delay: shaftDelay + WRITE_SHAFT + 40,
        duration: WRITE_HEAD,
        easing: 'linear',
      })
    }
    return () => {
      for (const animation of animations) animation.cancel()
    }
  }, [phase])

  useEffect(() => {
    const root = ref.current
    if (!root || phase !== 'erasing') return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Finish any writing in progress so the eraser has the whole note to rub out.
    for (const animation of root.getAnimations({ subtree: true })) animation.finish()
    const fade = (delay: number, duration: number) =>
      [...root.querySelectorAll('svg')].map((svg) =>
        svg.animate([{ opacity: 1 }, { opacity: 0 }], {
          delay,
          duration,
          easing: 'ease-in',
          fill: 'forwards',
        }),
      )
    const animations = still
      ? fade(0, 200)
      : [
          ...[...root.querySelectorAll('[data-hint-scrub]')].map((scrub, index) =>
            scrub.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
              // The return pass starts before the first one ends, as a hand would.
              delay: (index % 2) * ERASE * 0.4,
              duration: ERASE * 0.55,
              easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
              fill: 'forwards',
            }),
          ),
          ...fade(ERASE * 0.75, ERASE * 0.25),
        ]
    let cancelled = false
    void Promise.all(animations.map((animation) => animation.finished)).then(
      () => {
        if (!cancelled) erased.current()
      },
      () => {},
    )
    return () => {
      cancelled = true
    }
  }, [phase])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-[-31px] h-0 text-neutral-500 select-none dark:text-neutral-400"
    >
      {/* Beside the column when the page has room, otherwise in the header row. */}
      <Note
        id="right"
        label={label}
        className="absolute bottom-0 left-full hidden min-[1000px]:block"
      />
      <Note
        id="left"
        label={label}
        mirrored
        className="absolute right-2 bottom-0 min-[1000px]:hidden"
      />
    </div>
  )
}

function Note({
  id,
  label,
  mirrored = false,
  className,
}: {
  id: string
  label: string
  mirrored?: boolean
  className: string
}) {
  const mask = `wand-hint-erase-${id}`
  const flip = mirrored ? `translate(${WIDTH} 0) scale(-1 1)` : undefined
  const textX = mirrored ? WIDTH - TEXT_INSET : TEXT_INSET
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      overflow="visible"
      className={className}
    >
      <defs>
        <mask
          id={mask}
          maskUnits="userSpaceOnUse"
          x="-20"
          y="-20"
          width={WIDTH + 40}
          height={HEIGHT + 40}
        >
          <rect x="-20" y="-20" width={WIDTH + 40} height={HEIGHT + 40} fill="#fff" />
          {SCRUBS.map((scrub) => (
            <path
              key={scrub}
              data-hint-scrub
              d={scrub}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1}
              fill="none"
              stroke="#000"
              strokeOpacity={SCRUB_STRENGTH}
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={flip}
            />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${mask})`}>
        <text
          data-hint-text
          x={textX}
          y={BASELINE}
          textAnchor={mirrored ? 'end' : 'start'}
          fill="currentColor"
          className="font-hand text-sm"
          transform={`rotate(-3 ${textX} ${BASELINE})`}
        >
          {label}
        </text>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={flip}
        >
          <path data-hint-shaft d={SHAFT} pathLength={1} strokeDasharray="1 1" />
          <path data-hint-head d={HEAD} pathLength={1} strokeDasharray="1 1" />
        </g>
      </g>
    </svg>
  )
}

// The note only mounts on the client, after the visit's storage has been read.
function touchFirst() {
  return window.matchMedia('(hover: none)').matches
}
