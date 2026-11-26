// The hand that the blind wand's note and the postmark footer's thanks are written in: Caveat
// (src/styles.css, `font-hand`). Notes wait for it so they never write in a fallback face.

// How long a note waits for the font before it writes anyway.
const fontTimeout = 3000

/** Resolves once the hand's font has loaded, or after a few seconds without it. */
export function handFontReady() {
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, fontTimeout))
  return Promise.race([document.fonts.load('500 22px Caveat').then(() => {}), timeout]).catch(
    () => {},
  )
}
