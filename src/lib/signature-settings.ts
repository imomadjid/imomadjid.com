// The signature's draw and erase.
export const signatureTiming = {
  /** Seconds from the first segment to the last. */
  duration: 1.1,
  /** 0 gives every pen sample equal time; 1 draws at constant speed. */
  lengthWeight: 0.2,
  /** Time multiplier for the long stroke back to the left. */
  returnTime: 1.3,
  /** Time multiplier for the final flick to the right. */
  flickTime: 0.5,
  /** Seconds to erase along the path before a replay redraws it. */
  exitDuration: 0.45,
}

export type SignatureTiming = typeof signatureTiming
