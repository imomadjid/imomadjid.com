import type { CSSProperties } from 'react'

import { signatureStrokes, signatureViewBox } from '#/components/signature-strokes'

export type SignatureTiming = {
  /** Seconds before the pen touches down. */
  delay: number
  /** Seconds from the first segment to the last. */
  duration: number
  /** 0 gives every pen sample equal time; 1 draws at constant speed. */
  lengthWeight: number
  /** Time multiplier for the long stroke back to the left. */
  returnTime: number
  /** Time multiplier for the final flick to the right. */
  flickTime: number
}

export const defaultSignatureTiming: SignatureTiming = {
  delay: 0.6,
  duration: 1.1,
  lengthWeight: 0.2,
  returnTime: 1.3,
  flickTime: 0.5,
}

const startX = signatureStrokes.map(({ d }) => Number.parseFloat(d.slice(1)))
// The flick starts at the leftmost point; the return stroke starts at the turnaround before it.
const flickStart = startX.indexOf(Math.min(...startX))
const returnStart = startX.indexOf(Math.max(...startX.slice(0, flickStart)))

type StrokeStyle = CSSProperties & { '--stroke-delay': string; '--stroke-duration': string }

function strokeSchedule({ delay, duration, lengthWeight, returnTime, flickTime }: SignatureTiming) {
  const weights = signatureStrokes.map(({ length }, index) => {
    const pace = index >= flickStart ? flickTime : index >= returnStart ? returnTime : 1
    return length ** lengthWeight * pace
  })
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let elapsed = 0
  return weights.map((weight): StrokeStyle => {
    const start = elapsed
    elapsed += weight
    return {
      '--stroke-delay': `${(delay + (duration * start) / total).toFixed(4)}s`,
      '--stroke-duration': `${((duration * weight) / total).toFixed(4)}s`,
    }
  })
}

const defaultSchedule = strokeSchedule(defaultSignatureTiming)

export function Signature({ timing, className }: { timing?: SignatureTiming; className?: string }) {
  const schedule = timing ? strokeSchedule(timing) : defaultSchedule

  return (
    <>
      <span className="sr-only">Imo’s signature</span>
      <svg
        aria-hidden
        viewBox={signatureViewBox}
        width={324}
        height={133}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className={className}
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
    </>
  )
}
