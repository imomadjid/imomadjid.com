import { useSyncExternalStore } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'imomadjid:theme'
const CHANGE_EVENT = 'portfolio-theme-change'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'
let transitionTimeout: ReturnType<typeof setTimeout> | undefined

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function asTheme(value: string | null | undefined): Theme {
  return value === 'light' || value === 'dark' ? value : 'system'
}

function readPreference(): Theme {
  try {
    return asTheme(localStorage.getItem(STORAGE_KEY))
  } catch {
    return 'system'
  }
}

function applyTheme(theme: Theme, animate = true) {
  const root = document.documentElement
  const resolved =
    theme === 'system' ? (window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light') : theme

  if (!root.classList.contains(resolved)) {
    clearTimeout(transitionTimeout)
    root.classList.remove('theme-transitioning')
    if (animate && !prefersReducedMotion()) {
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
  applyTheme(theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Theme changes still work when storage is unavailable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getThemeSnapshot(): Theme {
  return asTheme(document.documentElement.dataset.theme)
}

function getServerThemeSnapshot(): Theme {
  return 'system'
}

export function useTheme() {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
}

function subscribeTheme(notify: () => void) {
  const media = window.matchMedia(MEDIA_QUERY)
  const onSystemChange = () => applyTheme(getThemeSnapshot())
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    applyTheme(readPreference())
    notify()
  }
  applyTheme(readPreference(), false)
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
export const THEME_SCRIPT = `(function(){var t="system";try{var s=localStorage.getItem("${STORAGE_KEY}");if(s==="light"||s==="dark")t=s}catch(e){}var r=document.documentElement;var v=t==="system"?(matchMedia("${MEDIA_QUERY}").matches?"dark":"light"):t;r.classList.add(v);r.dataset.theme=t;r.style.colorScheme=v})()`
