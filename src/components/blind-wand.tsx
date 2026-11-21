import { useEffect, useId, useRef } from 'react'

import type { AmbientSettings } from '#/lib/ambient-settings'
import { useResolvedScheme } from '#/lib/theme'

import { startBlindWand } from './blind-wand-engine'
import type { WandEngine } from './blind-wand-engine'
import {
  HOLE_RADIUS,
  HOLE_Y,
  ROD_RADIUS,
  ROD_START,
  SECTIONS,
  STRIPE_SAMPLES,
  TIP_START,
  UNMEASURED_LENGTH,
  hookPaths,
  profiles,
  rodPath,
  tipPath,
  wandIds,
} from './blind-wand-shape'
import { WandHint, useWandHint } from './wand-hint'

/** A blind's tilt wand hanging into the header row. Turning it switches the theme. */
export function BlindWand({ settings }: { settings: AmbientSettings }) {
  const scheme = useResolvedScheme()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const settingsRef = useRef(settings)
  const engine = useRef<WandEngine | null>(null)
  const mounted = useRef(false)
  const id = useId().replace(/[^\w-]/g, '')
  const ids = wandIds(id)
  const hint = useWandHint()
  const dismissHint = useRef(hint.dismiss)

  useEffect(() => {
    settingsRef.current = settings
    engine.current?.wake()
  }, [settings])

  useEffect(() => {
    dismissHint.current = hint.dismiss
  }, [hint.dismiss])

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return
    const wand = startBlindWand(
      button,
      id,
      () => settingsRef.current,
      () => dismissHint.current(),
    )
    engine.current = wand
    return () => {
      wand?.dispose()
      engine.current = null
    }
  }, [id])

  // Reads the scheme from the document, so hydrating from the server's light snapshot never
  // twists the wand on load.
  useEffect(() => {
    engine.current?.sync(mounted.current)
    mounted.current = true
  }, [scheme])

  const label =
    scheme === 'dark'
      ? 'Turn the blinds open, switch to light theme'
      : 'Turn the blinds closed, switch to dark theme'

  const hook = hookPaths(0)
  const hookStroke = {
    fill: 'none',
    stroke: '#a3a3a3',
    strokeWidth: 1.3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const

  return (
    <>
      {/* Written on the wall, so the wand hangs in front of it. */}
      {hint.phase && <WandHint scheme={scheme} phase={hint.phase} onErased={hint.erased} />}
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        className="group pointer-events-none absolute right-0 bottom-0 h-svh w-2 outline-none"
      >
        <svg
          aria-hidden="true"
          width="1"
          height="1"
          className="absolute bottom-0 left-1/2 overflow-visible"
        >
          <defs>
            <linearGradient
              id={ids.stripes}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={TIP_START}
              x2="0"
              y2={UNMEASURED_LENGTH}
            >
              {Array.from({ length: STRIPE_SAMPLES }, (_, index) => (
                <stop key={index} offset={index / (STRIPE_SAMPLES - 1)} stopColor="#fff" />
              ))}
            </linearGradient>
            <linearGradient
              id={ids.shade}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={TIP_START}
              x2="0"
              y2={UNMEASURED_LENGTH}
            >
              {Array.from({ length: STRIPE_SAMPLES }, (_, index) => (
                <stop
                  key={index}
                  offset={index / (STRIPE_SAMPLES - 1)}
                  stopColor="#000"
                  stopOpacity={0}
                />
              ))}
            </linearGradient>
            {/* Slats stripe the direct light along the wand. */}
            <mask id={ids.lit} maskUnits="userSpaceOnUse" x="-40" y="0" width="80" height="100000">
              <rect x="-40" y="0" width="80" height="100000" fill={`url(#${ids.stripes})`} />
            </mask>
            <mask id={ids.hole} maskUnits="userSpaceOnUse" x="-40" y="0" width="80" height="100000">
              <rect x="-40" y="0" width="80" height="100000" fill="#fff" />
              <ellipse data-wand-hole cx="0" cy={HOLE_Y} rx={HOLE_RADIUS} ry={HOLE_RADIUS} />
            </mask>
            {SECTIONS.flatMap((section) =>
              (['base', 'light'] as const).map((layer) => (
                <linearGradient
                  key={`${section}-${layer}`}
                  id={ids.gradient(section, layer)}
                  gradientUnits="userSpaceOnUse"
                  x1={-ROD_RADIUS}
                  x2={ROD_RADIUS}
                  y1="0"
                  y2="0"
                >
                  {Array.from({ length: profiles[section].length * 2 }, (_, index) => (
                    <stop key={index} offset={0} stopColor="#fff" stopOpacity={0} />
                  ))}
                </linearGradient>
              )),
            )}
          </defs>
          <g data-wand-swing transform={`translate(0 ${-UNMEASURED_LENGTH})`}>
            <path data-wand-hook="back" d={hook.back} {...hookStroke} />
            {(['rod', 'tip'] as const).map((section) => {
              const tip = section === 'tip'
              const outline = tip
                ? tipPath(-ROD_RADIUS * 1.45, ROD_RADIUS * 1.45, -ROD_RADIUS, ROD_RADIUS)
                : rodPath(-ROD_RADIUS, ROD_RADIUS, UNMEASURED_LENGTH)
              return (
                <g key={section} mask={tip ? `url(#${ids.hole})` : undefined}>
                  <path
                    data-wand-section={section}
                    d={outline}
                    fill={`url(#${ids.gradient(section, 'base')})`}
                  />
                  <path data-wand-section={section} d={outline} fill={`url(#${ids.shade})`} />
                  <path
                    data-wand-section={section}
                    d={outline}
                    fill={`url(#${ids.gradient(section, 'light')})`}
                    mask={`url(#${ids.lit})`}
                  />
                  {/* Light piping round the flat tip's molded edge. */}
                  {tip && (
                    <path
                      data-wand-section={section}
                      d={outline}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.6"
                      className="text-neutral-500/35 dark:text-neutral-400/30"
                    />
                  )}
                </g>
              )
            })}
            {/* The hole's wall catches the light as a thin ring. */}
            <ellipse
              data-wand-hole
              cx="0"
              cy={HOLE_Y}
              rx={HOLE_RADIUS}
              ry={HOLE_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              className="text-neutral-500/50 dark:text-neutral-400/40"
            />
            <path data-wand-hook="front" d={hook.front} {...hookStroke} />
            <rect
              data-wand-focus
              x={-ROD_RADIUS - 4}
              y={ROD_START}
              width={ROD_RADIUS * 2 + 8}
              height={UNMEASURED_LENGTH - ROD_START + 4}
              rx={ROD_RADIUS + 4}
              fill="none"
              stroke="var(--focus-ring)"
              className="opacity-0 group-focus-visible:opacity-100"
            />
            <line
              data-wand-hit
              x1="0"
              y1={TIP_START}
              x2="0"
              y2={UNMEASURED_LENGTH}
              stroke="transparent"
              strokeWidth="24"
              strokeLinecap="round"
              pointerEvents="stroke"
              className="pointer-events-auto cursor-pointer touch-none data-dragging:cursor-grabbing"
            >
              <title>Turn the blinds</title>
            </line>
          </g>
        </svg>
      </button>
    </>
  )
}
