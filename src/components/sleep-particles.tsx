import { animate, useReducedMotion } from 'motion/react'
import type { AnimationPlaybackControls } from 'motion/react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { RefObject } from 'react'

import { wallColor } from '#/lib/sunlit-scene'

import { breathPeriod, createBreath, flightPose, randomBetween } from './sleep-flight'
import type { SleepFlight } from './sleep-flight'

// Each Z wears a ring in the wall's colour, so where it crosses the photo it seems to cut the photo
// away, as a badge does an avatar. The ring is this many px wide outside the glyph at full size,
// shrinks with it, and shows only as the Z comes into focus (`flightPose`'s `ring`).
const ringWidth = 3.5

// Every Z floats in front of the photo (z-10), and a newer one lies over older ones, so where two
// cross the newer one's ring cuts the older one, as a stack of avatars does. A Z keeps its place
// for its whole flight, so two crossing Z's never swap mid-way.
const inFront = 11

// The photo breathes with the Z's: it swells a touch over the inhale, and the breath's first Z
// leaves the head as the exhale starts.
const inhale = 1400
const exhale = 1800
const swell = 1.02

type Particle = { id: number; flight: SleepFlight }

/** For /dev/sleep: play the Z's and the breathing slower, and hear of each breath's flights. */
export type SleepTuning = {
  /** 1 is real time; 0.25 plays at a quarter speed. It takes effect from the next breath. */
  speed?: number
  onBreath?: (flights: SleepFlight[]) => void
}

/** The Z, as SVG text for its round stroke joins: HTML text strokes mitre, spiking the corners. */
function ZGlyph({
  textRef,
  ring = 1,
}: {
  textRef?: RefObject<SVGTextElement | null>
  ring?: number
}) {
  return (
    <svg viewBox="0 0 24 24" className="size-full overflow-visible">
      {/* The stroke lies under the fill, so half of it shows, outside the glyph. */}
      <text
        ref={textRef}
        x="12"
        y="12"
        fontSize="20"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        stroke="var(--sleep-ring, var(--surface-1))"
        strokeWidth={ringWidth * 2 * ring}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        Z
      </text>
    </svg>
  )
}

const zClass =
  'pointer-events-none absolute top-3 left-3 size-6 font-black text-purple-500 select-none dark:text-purple-400'

function SleepParticle({
  flight,
  order,
  onDone,
}: Particle & { order: number; onDone: () => void }) {
  const span = useRef<HTMLSpanElement>(null)
  const text = useRef<SVGTextElement>(null)
  const finish = useEffectEvent(onDone)

  useEffect(() => {
    const element = span.current
    const glyph = text.current
    if (!element || !glyph) return
    const pose = (progress: number) => {
      const { x, y, scale, rotation, opacity, blur, ring } = flightPose(flight, progress)
      element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`
      element.style.opacity = String(opacity)
      element.style.filter = `blur(${blur}px)`
      glyph.style.strokeWidth = `${ringWidth * 2 * ring}px`
    }
    pose(0)
    // A clock, not a tween: the pose comes from the time since the Z left, so a frame that comes
    // late lands where it should be, and a flight that ran out while the tab slept just ends.
    const animation = animate(0, 1, {
      duration: Math.max(0, flight.start + flight.duration - performance.now()) / 1000,
      ease: 'linear',
      onUpdate: () =>
        pose(Math.min(1, Math.max(0, (performance.now() - flight.start) / flight.duration))),
      onComplete: finish,
    })
    return () => animation.stop()
  }, [flight])

  return (
    <span
      ref={span}
      aria-hidden="true"
      data-sleep-particle
      className={`${zClass} opacity-0`}
      style={{ zIndex: inFront + order }}
    >
      <ZGlyph textRef={text} />
    </span>
  )
}

/** With reduced motion, one Z rests by the head while Imo sleeps. */
function RestingZ({ isSleeping }: { isSleeping: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-sleep-particle
      className={`${zClass} transition-opacity duration-150`}
      style={{
        zIndex: inFront,
        opacity: isSleeping ? 1 : 0,
        transform: 'translate(22px, -22px) scale(0.85)',
      }}
    >
      <ZGlyph />
    </span>
  )
}

export default function SleepParticles({
  isSleeping,
  photo,
  tuning,
}: {
  isSleeping: boolean
  photo: RefObject<HTMLImageElement | null>
  tuning?: SleepTuning
}) {
  const { speed = 1, onBreath } = tuning ?? {}
  const reducedMotion = useReducedMotion() ?? false
  const [particles, setParticles] = useState<Particle[]>([])
  const nextId = useRef(0)
  const ring = useRef<HTMLSpanElement>(null)
  const breathed = useEffectEvent((flights: SleepFlight[]) => onBreath?.(flights))

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

  // Breathing: every breath, the photo swells and an exhale lets out the next Z's.
  useEffect(() => {
    if (!isSleeping || reducedMotion) return
    const image = photo.current
    let timer: ReturnType<typeof setTimeout>
    let breathing: AnimationPlaybackControls | undefined
    const breathe = () => {
      // A hidden tab skips its breaths, so it doesn't come back to a pile of them.
      if (document.visibilityState === 'visible') {
        // The breath's times count from its first Z leaving, at the end of the inhale.
        const now = performance.now()
        const flights = createBreath(0).map((flight) => ({
          ...flight,
          start: now + (inhale + flight.start) / speed,
          duration: flight.duration / speed,
        }))
        const added = flights.map((flight) => ({ id: ++nextId.current, flight }))
        setParticles((list) => [...list, ...added])
        breathed(flights)
        if (image) {
          breathing?.stop()
          breathing = animate(
            image,
            { scale: [null, swell, 1] },
            {
              duration: (inhale + exhale) / 1000 / speed,
              times: [0, inhale / (inhale + exhale), 1],
              ease: ['easeInOut', 'easeOut'],
            },
          )
        }
      }
      timer = setTimeout(breathe, randomBetween(breathPeriod.min, breathPeriod.max) / speed)
    }
    timer = setTimeout(breathe, 300 / speed)
    return () => {
      clearTimeout(timer)
      breathing?.stop()
      if (image) animate(image, { scale: 1 }, { duration: 0.6, ease: 'easeOut' })
      // On waking, Z's already out float on and dissolve; those still to leave stay in.
      const now = performance.now()
      setParticles((list) => list.filter((particle) => particle.flight.start <= now))
    }
  }, [isSleeping, reducedMotion, photo, speed])

  const land = (id: number) => setParticles((list) => list.filter((particle) => particle.id !== id))

  return (
    // `contents`, so the Z's still stack among the photo's layers and place from its box.
    <span ref={ring} className="contents">
      {reducedMotion ? (
        <RestingZ isSleeping={isSleeping} />
      ) : (
        particles.map((particle) => (
          <SleepParticle
            key={particle.id}
            {...particle}
            order={particle.id}
            onDone={() => land(particle.id)}
          />
        ))
      )}
      <output className="sr-only">{isSleeping ? 'Imo’s Sleep Focus is on' : ''}</output>
    </span>
  )
}
