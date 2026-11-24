import { bind, play, setEnabled, setTheme, unlock } from 'cuelume'

// Interface sound is cuelume's `press` theme, used as cuelume intends (see AGENTS.md): controls
// carry `data-cuelume-*` attributes for `bind()`, and `play()` is only for what code decides.

/** Where the visitor's choice lives. Only "off" is stored: sound is on until they turn it off. */
const STORAGE_KEY = 'imomadjid:sound'

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
  const started = on && (await unlock())
  setEnabled(started)
  store(started)
  if (started) play('toggle')
}

/** See more's run: three opens this far apart. */
const RUN_STEP_MS = 90

/**
 * See more opens every photo at once, so it plays three opens in a quick run, which the press
 * theme walks up a step each (A, C♯, F♯). The run waits for `unlock`: audio sleeps a second after
 * the last cue, and notes asked for while it wakes would play out of order.
 */
export function playOpenRun() {
  if (!getSoundOn()) return
  void unlock().then((running) => {
    if (!running) return
    for (let note = 0; note < 3; note++) setTimeout(() => play('open'), note * RUN_STEP_MS)
  })
}

/** Sets cuelume up for the site: the press theme, the visitor's choice, and the bindings. */
export function startSounds() {
  setTheme('press')
  setEnabled(getSoundOn())
  return bind()
}
