import type { SVGProps } from 'react'

/**
 * The "imo" mark, as in public/favicon.svg, drawn as centre-lines with a currentColor stroke: a
 * capsule, a rounded rectangle and a circle. At the default stroke width of 12 it matches the
 * favicon's outline; set `stroke-width` to change its weight. Size it by height.
 */
export function Logo(props: Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 152 68"
      fill="none"
      stroke="currentColor"
      strokeWidth={12}
      {...props}
    >
      <path d="M6 22A16 16 0 0 1 38 22V46A16 16 0 0 1 6 46Z" />
      <path d="M54 6H74A16 16 0 0 1 90 22V46A16 16 0 0 1 74 62H54A16 16 0 0 1 38 46V22A16 16 0 0 1 54 6Z" />
      <circle cx="118" cy="34" r="28" />
    </svg>
  )
}
