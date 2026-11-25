import { getThemeSnapshot, setTheme, useTheme } from '#/lib/theme'
import { cn } from '#/lib/utils'

import { MonitorDuoIcon, MoonDuoIcon, SunDuoIcon } from './theme-icons'
import { IconButton } from './ui/icon-button'

const themes = {
  system: {
    icon: MonitorDuoIcon,
    label: 'System',
    next: 'light',
    className:
      'in-data-[theme=system]:scale-100 in-data-[theme=system]:opacity-100 in-data-[theme=system]:blur-none',
  },
  light: {
    icon: SunDuoIcon,
    label: 'Light',
    next: 'dark',
    className:
      'in-data-[theme=light]:scale-100 in-data-[theme=light]:opacity-100 in-data-[theme=light]:blur-none',
  },
  dark: {
    icon: MoonDuoIcon,
    label: 'Dark',
    next: 'system',
    className:
      'in-data-[theme=dark]:scale-100 in-data-[theme=dark]:opacity-100 in-data-[theme=dark]:blur-none',
  },
} as const

export function ThemeToggle() {
  const current = themes[useTheme()]
  const label = `Theme: ${current.label}. Switch to ${themes[current.next].label}`

  return (
    <IconButton
      data-cuelume-toggle
      aria-label={label}
      title={label}
      onClick={() => {
        const next = themes[getThemeSnapshot()].next
        setTheme(next)
      }}
    >
      <span
        data-theme-icons
        aria-hidden="true"
        className="relative grid size-[18px] place-items-center"
      >
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
