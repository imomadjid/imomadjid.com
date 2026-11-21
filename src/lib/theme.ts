import { useSyncExternalStore } from 'react'

export type Theme = 'system' | 'light' | 'dark'
export type Scheme = 'light' | 'dark'

/**
 * The stored preference. `base` is the system scheme when `theme` was chosen: an override
 * against it lasts until the system catches up, while a choice equal to it stays pinned.
 * `seen` is the system scheme on the last visit; `auto` records that it has ever changed.
 */
export type ThemeRecord = {
  theme: Theme
  base: Scheme
  at: number
  seen: Scheme
  auto: boolean
}

const STORAGE_KEY = 'imomadjid:theme'
const CHANGE_EVENT = 'portfolio-theme-change'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'
let transitionTimeout: ReturnType<typeof setTimeout> | undefined

/**
 * Reads the stored preference and drops an override once the system has caught up with it:
 * choosing dark on a light afternoon holds until the system turns dark, then the site follows
 * the system again. When a visit misses that moment, a system seen to switch on its own is
 * assumed to have reached dark by 18:00 or light by 06:00 local time.
 *
 * THEME_SCRIPT inlines this function's source, so it must stay self-contained plain JS.
 */
export function settleTheme(raw: string | null, system: Scheme, now: number): ThemeRecord {
  const record: ThemeRecord = { theme: 'system', base: system, at: now, seen: system, auto: false }
  const isScheme = (value: string): value is Scheme => value === 'light' || value === 'dark'
  if (raw === 'light' || raw === 'dark') {
    // Earlier versions stored a bare choice; keep it pinned.
    record.theme = raw
    record.base = raw
  } else if (raw) {
    try {
      const stored: Record<string, string | number | boolean | undefined> = JSON.parse(raw)
      const theme = String(stored.theme)
      const base = String(stored.base)
      const seen = String(stored.seen)
      if (isScheme(theme)) {
        record.theme = theme
        record.base = isScheme(base) ? base : theme
        record.at = Number(stored.at) || 0
      }
      record.auto = stored.auto === true || (isScheme(seen) && seen !== system)
    } catch {
      // A malformed record falls back to the system theme.
    }
  }
  if (record.theme !== 'system' && record.theme !== record.base) {
    let expired = record.theme === system
    if (!expired && record.auto) {
      const catchUp = new Date(record.at)
      catchUp.setHours(record.theme === 'dark' ? 18 : 6, 0, 0, 0)
      if (catchUp.getTime() <= record.at) catchUp.setDate(catchUp.getDate() + 1)
      expired = now >= catchUp.getTime()
    }
    if (expired) {
      record.theme = 'system'
      record.base = system
      record.at = now
    }
  }
  return record
}

function systemScheme(): Scheme {
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

function readRecord(): ThemeRecord {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable; the system theme still applies.
  }
  return settleTheme(raw, systemScheme(), Date.now())
}

function writeRecord(record: ThemeRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Theme changes still work when storage is unavailable.
  }
}

function applyTheme(theme: Theme, animate = true) {
  const root = document.documentElement
  const resolved = theme === 'system' ? systemScheme() : theme

  if (!root.classList.contains(resolved)) {
    clearTimeout(transitionTimeout)
    root.classList.remove('theme-transitioning')
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('theme-transitioning')
      // Flush styles so the transition applies before the class swap.
      void root.offsetHeight
      transitionTimeout = setTimeout(() => root.classList.remove('theme-transitioning'), 200)
    }
  }
  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
  root.dataset.theme = theme
  root.style.colorScheme = resolved
}

export function setTheme(theme: Theme) {
  const record = readRecord()
  const system = systemScheme()
  writeRecord({ ...record, theme, base: system, at: Date.now(), seen: system })
  applyTheme(theme)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getResolvedScheme(): Scheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Flips between light and dark. Landing on the system scheme follows the system again. */
export function toggleScheme(): Scheme {
  const next = getResolvedScheme() === 'dark' ? 'light' : 'dark'
  setTheme(next === systemScheme() ? 'system' : next)
  return next
}

export function getThemeSnapshot(): Theme {
  const theme = document.documentElement.dataset.theme
  return theme === 'light' || theme === 'dark' ? theme : 'system'
}

function getServerThemeSnapshot(): Theme {
  return 'system'
}

export function useTheme() {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
}

function getServerScheme(): Scheme {
  return 'light'
}

/** The scheme on screen, including the system's when the preference is `system`. */
export function useResolvedScheme() {
  return useSyncExternalStore(subscribeScheme, getResolvedScheme, getServerScheme)
}

function subscribeScheme(notify: () => void) {
  const unsubscribe = subscribeTheme(notify)
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => {
    observer.disconnect()
    unsubscribe()
  }
}

function subscribeTheme(notify: () => void) {
  const media = window.matchMedia(MEDIA_QUERY)
  const onSystemChange = () => {
    // Settling against the new system scheme ends an override it has caught up with.
    const record = readRecord()
    writeRecord(record)
    applyTheme(record.theme)
    notify()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    applyTheme(readRecord().theme)
    notify()
  }
  applyTheme(readRecord().theme, false)
  media.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, notify)
  return () => {
    media.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, notify)
  }
}

// Static, trusted script. Runs before paint; no browser globals run during SSR.
export const THEME_SCRIPT = `(function(){var settle=${settleTheme.toString()};var m=matchMedia("${MEDIA_QUERY}").matches?"dark":"light";var raw=null;try{raw=localStorage.getItem("${STORAGE_KEY}")}catch(e){}var p=settle(raw,m,Date.now());try{localStorage.setItem("${STORAGE_KEY}",JSON.stringify(p))}catch(e){}var r=document.documentElement;var v=p.theme==="system"?m:p.theme;r.classList.add(v);r.dataset.theme=p.theme;r.style.colorScheme=v})()`
