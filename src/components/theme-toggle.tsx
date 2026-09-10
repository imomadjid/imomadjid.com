import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import { useHydrated } from '@tanstack/react-router'
import { domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react'
import { useSyncExternalStore } from 'react'

import { getServerThemeSnapshot, getThemeSnapshot, setTheme, subscribeTheme } from '#/lib/theme'

import { IconButton } from './ui/icon-button'

const themes = {
  system: { icon: IconDeviceDesktop, label: 'System', next: 'light' },
  light: { icon: IconSun, label: 'Light', next: 'dark' },
  dark: { icon: IconMoon, label: 'Dark', next: 'system' },
} as const
// Lukis's critically damped icon curve, settled at 300ms.
const iconEase = (t: number) =>
  t === 1 ? 1 : 1 - Math.exp(-9.233413476 * t) * (1 + 9.233413476 * t)

export function ThemeToggle() {
  const hydrated = useHydrated()
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
  const reducedMotion = useReducedMotion()
  const current = themes[theme]
  const label = `Theme: ${current.label}. Switch to ${themes[current.next].label}`
  const hidden = {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.25,
    filter: reducedMotion ? 'blur(0px)' : 'blur(4px)',
  }

  return (
    <IconButton
      aria-label={label}
      title={label}
      onClick={() => setTheme(themes[getThemeSnapshot()].next)}
    >
      <LazyMotion features={domAnimation}>
        <span
          data-theme-icons
          aria-hidden="true"
          className="relative grid size-5 place-items-center"
        >
          {Object.entries(themes).map(([mode, { icon: Icon }]) =>
            !hydrated ? (
              <span
                key={mode}
                data-initial-theme-icon={mode}
                className="absolute grid place-items-center"
              >
                <Icon />
              </span>
            ) : (
              <m.span
                key={mode}
                className="absolute grid place-items-center"
                initial={false}
                animate={mode === theme ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : hidden}
                transition={{
                  duration: reducedMotion ? 0.12 : 0.3,
                  ease: reducedMotion ? [0.23, 1, 0.32, 1] : iconEase,
                }}
              >
                <Icon />
              </m.span>
            ),
          )}
        </span>
      </LazyMotion>
    </IconButton>
  )
}
