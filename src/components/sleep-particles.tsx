import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  animate,
  domAnimation,
  useMotionValue,
  usePresence,
} from 'motion/react'
import type { AnimationPlaybackControls } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useEffectEvent, useRef } from 'react'
import type { RefObject } from 'react'

import { wallColor } from '#/lib/sunlit-scene'

import { flightPose, randomBetween, reserveFlight } from './sleep-flight'
import type { SleepFlight } from './sleep-flight'

// Each Z wears a ring in the wall's colour, so where it crosses the photo it seems to cut the photo
// away, as a badge does an avatar. The ring is this many px wide outside the glyph at full size,
// and shrinks with it.
const ringWidth = 2

// Stacking within the avatar, whose photo is z-10: a Z climbs in front of the photo and sinks
// behind it on the way back. Among the Z's on one side, a newer one lies over an older one, so
// where two cross the newer one's ring cuts the older one, as a stack of avatars does. A Z keeps
// its place for its whole flight, so two crossing Z's never swap mid-way.
const inFront = 11
const behind = -1_000_000
let flightsFlown = 0

function SleepParticle({
  slot,
  flights: flightRegistry,
}: {
  slot: number
  flights: RefObject<Map<number, SleepFlight>>
}) {
  const [isPresent, safeToRemove] = usePresence()
  const setPresence = useRef<((present: boolean) => void) | null>(null)
  const removeParticle = useEffectEvent(() => safeToRemove?.())
  const transform = useMotionValue('translate(0px, 0px) scale(0.25)')
  const opacity = useMotionValue(0)
  const filter = useMotionValue('blur(4px)')
  const zIndex = useMotionValue(inFront)

  useEffect(() => {
    const flights = flightRegistry.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animation: AnimationPlaybackControls | undefined
    let present = true
    let started = false
    let finished = false

    function finish() {
      flights.delete(slot)
      finished = true
      removeParticle()
    }

    function fadeOut() {
      animation?.stop()
      animation = animate(opacity, 0, { duration: 0.16, onComplete: finish })
    }

    function play(startDelay: number) {
      started = false
      finished = false
      // Choose a new flight only between loops, never during render or mid-flight.
      const now = performance.now()
      const flight = reserveFlight(flights, slot, now + startDelay * 1000 + randomBetween(200, 600))
      const order = ++flightsFlown
      let behindPhoto = false

      opacity.set(0)
      zIndex.set(inFront + order)

      animation = animate(0, 1, {
        duration: (flight.start - now + flight.duration) / 1000,
        ease: 'linear',
        onUpdate: () => {
          const progress = Math.min(
            1,
            Math.max(0, (performance.now() - flight.start) / flight.duration),
          )
          started ||= progress > 0
          const { x, y, scale, rotation, opacity: alpha, blur } = flightPose(flight, progress)

          // The photo radius is 24px. Include the glyph's size and ring, its scale, and
          // blur in its clearance. Switch once, in the same frame as the pose.
          if (!behindPhoto && Math.hypot(x, y) > 24 + (13 + ringWidth) * scale + 3 * blur) {
            behindPhoto = true
            zIndex.set(behind + order)
          }

          transform.set(`translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`)
          opacity.set(alpha)
          filter.set(`blur(${blur}px)`)
        },
        onComplete: () => {
          if (present) play(0)
          else finish()
        },
      })
    }

    function updateMotion() {
      animation?.stop()
      flights.delete(slot)
      if (!present) {
        fadeOut()
      } else if (reducedMotion.matches) {
        finished = false
        transform.set('translate(22px, -22px) scale(0.85)')
        opacity.set(slot === 0 ? 1 : 0)
        filter.set('blur(0px)')
        zIndex.set(inFront)
      } else {
        play(slot * 1.5)
      }
    }

    setPresence.current = (nextPresent) => {
      present = nextPresent
      if (present) {
        // Re-entering keeps an unfinished flight; completed slots can start again.
        if (finished || reducedMotion.matches) updateMotion()
      } else if (reducedMotion.matches) {
        fadeOut()
      } else if (!started) {
        // A slot still waiting to spawn has no visible flight to finish.
        animation?.stop()
        finish()
      }
    }

    updateMotion()
    reducedMotion.addEventListener('change', updateMotion)
    return () => {
      reducedMotion.removeEventListener('change', updateMotion)
      animation?.stop()
      flights.delete(slot)
      setPresence.current = null
    }
  }, [slot, flightRegistry, transform, opacity, filter, zIndex])

  useEffect(() => {
    setPresence.current?.(isPresent)
  }, [isPresent])

  return (
    <m.span
      aria-hidden="true"
      data-sleep-particle
      className="pointer-events-none absolute top-3 left-3 size-6 font-black text-purple-500 select-none dark:text-purple-400"
      style={{
        transform,
        opacity,
        filter,
        zIndex,
      }}
    >
      {/* SVG text, for its round stroke joins: HTML text strokes mitre, which spikes the Z's
          corners. The stroke lies under the fill, so half of it shows, outside the glyph. */}
      <svg viewBox="0 0 24 24" className="size-full overflow-visible">
        <text
          x="12"
          y="12"
          fontSize="20"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          stroke="var(--sleep-ring, var(--surface-1))"
          strokeWidth={ringWidth * 2}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          Z
        </text>
      </svg>
    </m.span>
  )
}

export default function SleepParticles({ isSleeping }: { isSleeping: boolean }) {
  const flights = useRef(new Map<number, SleepFlight>())
  const ring = useRef<HTMLSpanElement>(null)

  // The rings take the wall's colour as the renderer paints it, frame by frame through theme
  // changes and the glow; without the renderer, the wall is the surface colour they fall back to.
  useEffect(() => {
    const element = ring.current
    if (!element) return
    const paint = (color: string | null) => {
      if (color) element.style.setProperty('--sleep-ring', color)
      else element.style.removeProperty('--sleep-ring')
    }
    paint(wallColor.get())
    return wallColor.subscribe(paint)
  }, [])

  return (
    // `contents`, so the Z's still stack among the photo's layers and place from its box.
    <span ref={ring} className="contents">
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation}>
          <AnimatePresence>
            {isSleeping &&
              [0, 1, 2].map((slot) => <SleepParticle key={slot} slot={slot} flights={flights} />)}
          </AnimatePresence>
        </LazyMotion>
      </MotionConfig>
      <output className="sr-only">{isSleeping ? 'Imo’s Sleep Focus is on' : ''}</output>
    </span>
  )
}
