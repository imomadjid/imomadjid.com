import { bind, play, setEnabled, setTheme, unlock } from 'cuelume'

// Every interface sound on the site is a cuelume cue (github.com/danielwh2/cuelume, MIT) in its
// `press` theme: a click over a deep note that rings, letting go with a lighter click. Used as
// cuelume intends: controls carry a `data-cuelume-*` attribute, so `bind()` plays them as the
// press goes down and lets go as it lifts; `play()` is only for what code decides, like a dialog
// closed by Escape. Pick each cue by its job from cuelume's "Which cue?" table. No hover cues.
// cuelume 0.2.9 is vendored as vendor/cuelume-0.2.9.tgz, built from its v0.2.9 tag, because npm
// has only 0.2.8, which keeps the audio device open and doesn't recover after a Safari lock.
// Depend on the npm release once 0.2.9 is published.

/** Where the visitor's choice lives. Only "off" is stored: sound is on until they turn it off. */
const STORAGE_KEY = 'sound'

const listeners = new Set<() => void>()
let soundOn: boolean | null = null

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/** Whether sound is on: the footer's Sound switch. */
export function getSoundOn() {
  soundOn ??= readStored()
  return soundOn
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function store(on: boolean) {
  soundOn = on
  try {
    if (on) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, 'off')
  } catch {
    // Private windows can refuse storage; the choice still holds for this visit.
  }
  for (const listener of listeners) listener()
}

/**
 * Turns sound on or off, from the Sound switch's click. Turning it on starts audio in that same
 * gesture, as cuelume asks, and trusts whether audio started over the switch; then the switch
 * itself plays, so the visitor hears it worked. Turning it off is silent.
 */
export async function setSoundOn(on: boolean) {
  setEnabled(on)
  if (!on) {
    store(false)
    return
  }
  const started = await unlock()
  setEnabled(started)
  store(started)
  if (started) play('toggle')
}

/** See more's run: four opens this far apart. */
const RUN_STEP_MS = 90

/**
 * Opening every photo at once is grander than opening one: four opens in a quick run, which
 * cuelume walks up a step each, A, C#, E and the A above (`open`'s walk is patched to reach the
 * octave, patches/cuelume@*.patch). Played from code, since one press makes all four. Call it in
 * the click: cuelume lets audio sleep a second after the last cue, and a note asked for while it
 * wakes waits for it while the next may not, so the run starts once `unlock` has it running.
 */
export function playOpenRun() {
  if (!getSoundOn()) return
  void unlock().then((running) => {
    if (!running) return
    for (let note = 0; note < 4; note++) setTimeout(() => play('open'), note * RUN_STEP_MS)
  })
}

/** Sets cuelume up for the site: the press theme, the visitor's choice, and the bindings. */
export function startSounds() {
  setTheme('press')
  setEnabled(getSoundOn())
  return bind()
}
