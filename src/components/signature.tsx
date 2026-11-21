import type { CSSProperties } from 'react'

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

export function Signature({ timing, className }: { timing: SignatureTiming; className?: string }) {
  const schedule = strokeSchedule(timing)

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
