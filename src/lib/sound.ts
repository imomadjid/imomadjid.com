import { bind, play, setEnabled, setTheme, unlock } from 'cuelume'

// Interface sound is cuelume's `press` theme, used as cuelume intends (see AGENTS.md): controls
// carry `data-cuelume-*` attributes for `bind()`, and `play()` is only for what code decides.

/** Where the visitor's choice lives. Only "off" is stored: sound is on until they turn it off. */
const STORAGE_KEY = 'imomadjid:sound'

/**
 * Marks the page `data-sound="off"` before it paints, so the footer's switch shows the stored
 * choice from the prerendered HTML on. Runs inline in the head; keep it self-contained.
 */
export const SOUND_SCRIPT = `(function(){try{if(localStorage.getItem("${STORAGE_KEY}")==="off")document.documentElement.dataset.sound="off"}catch(e){}})()`

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
  return () => {
    listeners.delete(listener)
  }
}

/** Sound on or off for this visit: cuelume, the switch, and the page's `data-sound`. */
function apply(on: boolean) {
  soundOn = on
  setEnabled(on)
  if (on) delete document.documentElement.dataset.sound
  else document.documentElement.dataset.sound = 'off'
  for (const listener of listeners) listener()
}

function persist(on: boolean) {
  try {
    if (on) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, 'off')
  } catch {
    // Private windows can refuse storage; the choice still holds for this visit.
  }
}

/**
 * Turns sound on or off, from the Sound switch's click. Turning it on starts audio in that same
 * gesture, as cuelume asks, and trusts whether audio started over the switch; then the switch
 * itself plays, so the visitor hears it worked. Audio that won't start shows off for this visit
 * but isn't stored: the visitor didn't choose it. Turning it off is silent.
 */
export async function setSoundOn(on: boolean) {
  if (!on) {
    apply(false)
    persist(false)
    return
  }
  const started = await unlock()
  apply(started)
  if (!started) return
  persist(true)
  play('toggle')
}

/**
 * Starts audio from a gesture whose cue plays later, as the blind wand's ticks do from animation
 * frames: bound controls start it on the press, but audio sleeps a second after the last cue, and
 * Safari only wakes it in a gesture.
 */
export function wakeSound() {
  if (getSoundOn()) void unlock()
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
  let stopped = !getSoundOn()
  if (!stopped) {
    void unlock().then((running) => {
      if (!running || stopped) return
      for (let note = 0; note < 3; note++)
        timers.push(setTimeout(() => play('open'), note * RUN_STEP_MS))
    })
  }
  return () => {
    stopped = true
    for (const timer of timers) clearTimeout(timer)
  }
}

/**
 * Sets cuelume up for the site: the press theme, the visitor's choice, and the bindings. A choice
 * made in another tab follows here too.
 */
export function startSounds() {
  setTheme('press')
  setEnabled(getSoundOn())
  const unbind = bind()
  const follow = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) apply(readStored())
  }
  window.addEventListener('storage', follow)
  return () => {
    unbind()
    window.removeEventListener('storage', follow)
  }
}
