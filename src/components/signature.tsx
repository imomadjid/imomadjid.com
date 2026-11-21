import { useRef, useState } from 'react'
import type { AnimationEvent, CSSProperties } from 'react'

import {
  signatureFlickStart,
  signatureReturnStart,
  signatureStrokes,
  signatureViewBox,
} from '#/components/signature-strokes'
import type { SignatureTiming } from '#/lib/signature-settings'

type StrokeStyle = CSSProperties &
  Record<'--stroke-start' | '--stroke-duration' | '--exit-start' | '--exit-duration', string>

// Splits `seconds` into back-to-back slots sized by `weights`, as CSS times.
function slots(weights: number[], seconds: number) {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let elapsed = 0
  return weights.map((weight) => {
    const start = elapsed
    elapsed += weight
    return {
      start: `${((seconds * start) / total).toFixed(4)}s`,
      duration: `${((seconds * weight) / total).toFixed(4)}s`,
    }
  })
}

function strokeSchedule({
  duration,
  lengthWeight,
  returnTime,
  flickTime,
  exitDuration,
  exitLengthWeight,
}: SignatureTiming) {
  // The draw follows the pen's rhythm. The exit keeps half of it: it still eases through the
  // turns into the flick, without the flick's speed-up that made it vanish.
  const draw = slots(
    signatureStrokes.map(({ length }, index) => {
      const pace =
        index >= signatureFlickStart ? flickTime : index >= signatureReturnStart ? returnTime : 1
      return length ** lengthWeight * pace
    }),
    duration,
  )
  const exit = slots(
    signatureStrokes.map(({ length }) => length ** exitLengthWeight),
    exitDuration,
  )
  return draw.map((slot, index): StrokeStyle => ({
    '--stroke-start': slot.start,
    '--stroke-duration': slot.duration,
    '--exit-start': exit[index].start,
    '--exit-duration': exit[index].duration,
  }))
}

// Exit erases along the path in drawing order, then the pen draws it again without the entrance delay.
type Phase = 'enter' | 'exit' | 'redraw'

export function Signature({ timing, className }: { timing: SignatureTiming; className?: string }) {
  const [phase, setPhase] = useState<Phase>('enter')
  const svgRef = useRef<SVGSVGElement>(null)
  const schedule = strokeSchedule(timing)

  function replay() {
    const svg = svgRef.current
    if (!svg || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Let a running entrance, exit, or redraw finish before starting another.
    if (svg.getAnimations({ subtree: true }).some(({ playState }) => playState === 'running'))
      return
    setPhase('exit')
  }

  function handleAnimationEnd(event: AnimationEvent<SVGSVGElement>) {
    if (
      event.animationName === 'signature-erase' &&
      event.target === event.currentTarget.lastChild
    ) {
      setPhase('redraw')
    }
  }

  return (
    <button
      type="button"
      aria-label="Replay Imo’s signature"
      onClick={replay}
      className="-m-2 cursor-pointer rounded-lg p-2 transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
    >
      <svg
        ref={svgRef}
        aria-hidden
        data-phase={phase}
        viewBox={signatureViewBox}
        width={324}
        height={133}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className={className}
        onAnimationEnd={handleAnimationEnd}
      >
        {signatureStrokes.map(({ d, width }, index) => (
          <path
            key={d}
            d={d}
            strokeWidth={width}
            pathLength={1}
            className="animate-signature-stroke"
            style={schedule[index]}
          />
        ))}
      </svg>
    </button>
  )
}
