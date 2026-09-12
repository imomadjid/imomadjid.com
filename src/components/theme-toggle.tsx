import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import { useSyncExternalStore } from 'react'

import { getServerThemeSnapshot, getThemeSnapshot, setTheme, subscribeTheme } from '#/lib/theme'
import { cn } from '#/lib/utils'

import { IconButton } from './ui/icon-button'

const themes = {
  system: {
    icon: IconDeviceDesktop,
    label: 'System',
    next: 'light',
    className:
      'in-data-[theme=system]:scale-100 in-data-[theme=system]:opacity-100 in-data-[theme=system]:blur-none',
  },
  light: {
    icon: IconSun,
    label: 'Light',
    next: 'dark',
    className:
      'in-data-[theme=light]:scale-100 in-data-[theme=light]:opacity-100 in-data-[theme=light]:blur-none',
  },
  dark: {
    icon: IconMoon,
    label: 'Dark',
    next: 'system',
    className:
      'in-data-[theme=dark]:scale-100 in-data-[theme=dark]:opacity-100 in-data-[theme=dark]:blur-none',
  },
} as const
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
  const current = themes[theme]
  const label = `Theme: ${current.label}. Switch to ${themes[current.next].label}`

  return (
    <IconButton
      aria-label={label}
      title={label}
      onClick={() => setTheme(themes[getThemeSnapshot()].next)}
    >
      <span data-theme-icons aria-hidden="true" className="relative grid size-5 place-items-center">
        {Object.entries(themes).map(([mode, { icon: Icon, className }]) => (
          <span
            key={mode}
            data-theme-icon={mode}
            className={cn(
              'absolute grid scale-25 place-items-center opacity-0 blur-[4px] transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:scale-none! motion-reduce:filter-none! motion-reduce:transition-opacity motion-reduce:duration-120 motion-reduce:ease-out',
              className,
            )}
          >
            <Icon />
          </span>
        ))}
      </span>
    </IconButton>
  )
}
