import type { ReactNode, SVGProps } from 'react'

// 18px duotone set: 1.5 stroke, round caps, main shapes inset 1.75, secondary fill at 0.3.
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
} as const

function Icon(props: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 18"
      width={18}
      height={18}
      aria-hidden="true"
      {...props}
    />
  )
}

// Fill Duo: bodies are a single 0.4-opacity layer (group opacity avoids fill/stroke overlap),
// details are solid primary.
const tint = { opacity: 0.4 } as const
const body = { ...stroke, fill: 'currentColor' } as const

export function MonitorDuoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...tint}>
        <path
          d="M4 2.75H14C15.105 2.75 16 3.645 16 4.75V10.25C16 11.355 15.105 12.25 14 12.25H4C2.895 12.25 2 11.355 2 10.25V4.75C2 3.645 2.895 2.75 4 2.75Z"
          {...body}
        />
      </g>
      <path d="M9 13.25V15.25M5.75 15.25H12.25" {...stroke} />
    </Icon>
  )
}

export function SunDuoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...tint}>
        <circle cx="9" cy="9" r="3.75" {...body} />
      </g>
      <path
        d="M9 1.75V2.75M16.25 9H15.25M9 16.25V15.25M1.75 9H2.75M14.127 3.873L13.419 4.581M14.127 14.127L13.419 13.419M3.873 14.127L4.581 13.419M3.873 3.873L4.581 4.581"
        {...stroke}
      />
    </Icon>
  )
}

export function MoonDuoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...tint}>
        <path d="M7.759 2.365A6.75 6.75 0 1 0 15.635 10.241A5.6 5.6 0 0 1 7.759 2.365Z" {...body} />
      </g>
    </Icon>
  )
}
