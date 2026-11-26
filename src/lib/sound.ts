import { bind, play, setTheme, unlock } from 'cuelume'

// Interface sound is cuelume's `press` theme, used as cuelume intends (see AGENTS.md): controls
// carry `data-cuelume-*` attributes for `bind()`, and `play()` is only for what code decides.

/**
 * Starts audio from a gesture whose cue plays later, as the blind wand's ticks do from animation
 * frames: bound controls start it on the press, but audio sleeps a second after the last cue, and
 * Safari only wakes it in a gesture.
 */
export function wakeSound() {
  void unlock()
}

/** See more's run: three opens this far apart. */
const RUN_STEP_MS = 90

/**
 * See more opens every photo at once, so it plays three opens in a quick run, which the press
 * theme walks up a step each (A, C♯, F♯). The run waits for `unlock`: audio sleeps a second after
 * the last cue, and notes asked for while it wakes would play out of order. The walk carries on
 * from an open less than a second before, so a run that soon after one starts a step up.
 * Returns a function that stops the notes still to come, for a close that beats them.
 */
export function playOpenRun() {
  const timers: ReturnType<typeof setTimeout>[] = []
  let stopped = false
  void unlock().then((running) => {
    if (!running || stopped) return
    for (let note = 0; note < 3; note++)
      timers.push(setTimeout(() => play('open'), note * RUN_STEP_MS))
  })
  return () => {
    stopped = true
    for (const timer of timers) clearTimeout(timer)
  }
}

/** Sets cuelume up for the site: the press theme and the bindings. */
export function startSounds() {
  setTheme('press')
  return bind()
}
