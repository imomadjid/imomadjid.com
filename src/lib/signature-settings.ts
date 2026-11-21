import type { DialConfig, ResolvedValues } from 'dialkit'

export const signatureControls = {
  replay: { type: 'action', label: 'Replay signature' },
  /** Seconds from the first segment to the last. */
  duration: [1.1, 0.3, 3, 0.05],
  /** 0 gives every pen sample equal time; 1 draws at constant speed. */
  lengthWeight: [0.2, 0, 1, 0.05],
  /** Time multiplier for the long stroke back to the left. */
  returnTime: [1.3, 0.3, 2.5, 0.05],
  /** Time multiplier for the final flick to the right. */
  flickTime: [0.5, 0.2, 2, 0.05],
  /** Seconds to erase along the path before a replay redraws it. */
  exitDuration: [0.5, 0.15, 1.5, 0.05],
  /** Like lengthWeight for the erase: lower eases harder into turns, 1 erases at even speed. */
  exitLengthWeight: [0.5, 0, 1, 0.05],
} satisfies DialConfig

export type SignatureTiming = Omit<ResolvedValues<typeof signatureControls>, 'replay'>

const { duration, lengthWeight, returnTime, flickTime, exitDuration, exitLengthWeight } =
  signatureControls

// Production values; DialKit only tunes these in development.
export const defaultSignatureTiming: SignatureTiming = {
  duration: duration[0],
  lengthWeight: lengthWeight[0],
  returnTime: returnTime[0],
  flickTime: flickTime[0],
  exitDuration: exitDuration[0],
  exitLengthWeight: exitLengthWeight[0],
}
