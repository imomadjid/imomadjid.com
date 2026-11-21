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

import { flightPose, randomBetween, reserveFlight } from './sleep-flight'
import type { SleepFlight } from './sleep-flight'

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
  const zIndex = useMotionValue(20)

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
      let behindPhoto = false

      opacity.set(0)
      zIndex.set(20)

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

          // The photo radius is 24px. Include the glyph's size, scale, and
          // blur in its clearance. Switch once, in the same frame as the pose.
          if (!behindPhoto && Math.hypot(x, y) > 24 + 13 * scale + 3 * blur) {
            behindPhoto = true
            zIndex.set(0)
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
        zIndex.set(20)
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
      className="pointer-events-none absolute top-3 left-3 grid size-6 place-items-center text-xl leading-none font-black text-purple-500 select-none dark:text-purple-400"
      style={{
        transform,
        opacity,
        filter,
        zIndex,
      }}
    >
      Z
    </m.span>
  )
}

export default function SleepParticles({ isSleeping }: { isSleeping: boolean }) {
  const flights = useRef(new Map<number, SleepFlight>())
  return (
    <>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation}>
          <AnimatePresence>
            {isSleeping &&
              [0, 1, 2].map((slot) => <SleepParticle key={slot} slot={slot} flights={flights} />)}
          </AnimatePresence>
        </LazyMotion>
      </MotionConfig>
      <output className="sr-only">{isSleeping ? 'Sleep Focus is on' : ''}</output>
    </>
  )
}
