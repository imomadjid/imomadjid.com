import { useRef, useState } from 'react'
import type { AnimationEvent, CSSProperties } from 'react'

import {
  signatureFlickStart,
  signatureReturnStart,
  signatureStrokes,
  signatureViewBox,
} from '#/components/signature-strokes'
import type { SignatureTiming } from '#/lib/signature-settings'

type StrokeStyle = CSSProperties & { '--stroke-start': string; '--stroke-duration': string }

function strokeSchedule({ duration, lengthWeight, returnTime, flickTime }: SignatureTiming) {
  const weights = signatureStrokes.map(({ length }, index) => {
    const pace =
      index >= signatureFlickStart ? flickTime : index >= signatureReturnStart ? returnTime : 1
    return length ** lengthWeight * pace
  })
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let elapsed = 0
  return weights.map((weight): StrokeStyle => {
    const start = elapsed
    elapsed += weight
    return {
      '--stroke-start': `${((duration * start) / total).toFixed(4)}s`,
      '--stroke-duration': `${((duration * weight) / total).toFixed(4)}s`,
    }
  })
}

// Exit erases along the path in drawing order, then the pen draws it again without the entrance delay.
type Phase = 'enter' | 'exit' | 'redraw'

export function Signature({ timing, className }: { timing: SignatureTiming; className?: string }) {
  const [phase, setPhase] = useState<Phase>('enter')
  const svgRef = useRef<SVGSVGElement>(null)
  const schedule = strokeSchedule(timing)
  const svgStyle: CSSProperties & { '--exit-scale': number } = {
    '--exit-scale': timing.exitDuration / timing.duration,
  }

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
        style={svgStyle}
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
