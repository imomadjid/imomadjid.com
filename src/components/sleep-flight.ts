import { smoothStep } from '#/lib/ambient-transition'

export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function bezier(t: number, start: number, first: number, second: number, end: number) {
  const remaining = 1 - t
  return (
    remaining ** 3 * start +
    3 * remaining ** 2 * t * first +
    3 * remaining * t ** 2 * second +
    t ** 3 * end
  )
}

export function createFlight(start: number) {
  return {
    start,
    duration: randomBetween(4800, 5800),
    startX: randomBetween(5, 10),
    startY: randomBetween(-13, -8),
    crestX: randomBetween(28, 32),
    crestY: randomBetween(-32, -28),
    size: randomBetween(0.9, 1.05),
    tilt: randomBetween(-12, 8),
    sway: randomBetween(-4, 4),
  }
}

export type SleepFlight = ReturnType<typeof createFlight>

export function flightPose(flight: SleepFlight, progress: number) {
  const { startX, startY, crestX, crestY, size, tilt, sway } = flight
  const rising = progress < 0.55
  const t = rising ? progress / 0.55 : (progress - 0.55) / 0.45
  const x = rising
    ? bezier(t, startX, startX - 3, crestX - 9, crestX)
    : bezier(t, crestX, crestX + 9 * (0.45 / 0.55), 18, 8)
  const y = rising
    ? bezier(t, startY, startY - 12, crestY - 4, crestY)
    : bezier(t, crestY, crestY + 4 * (0.45 / 0.55), 8, -6)
  const drift = sway * Math.sin(Math.PI * progress) ** 2 * Math.sin(2 * Math.PI * progress)
  const emerge = smoothStep(progress / 0.24)
  const retreat = smoothStep((progress - 0.55) / 0.45)
  const fade = smoothStep((progress - 0.72) / 0.28)
  return {
    x: x + drift,
    y,
    scale: (0.25 + 0.75 * emerge) * size * (1 - 0.35 * retreat),
    rotation: tilt + 12 * Math.sin(Math.PI * progress),
    opacity: smoothStep(progress / 0.16) * (1 - fade),
    blur: 4 * (1 - emerge) + 4 * fade,
  }
}

// Approximate the glyph with a rotated 16px square. Sample only
// shared visible space, so letters returning under the photo do not block spawns.
function footprint(flight: SleepFlight, time: number) {
  const progress = (time - flight.start) / flight.duration
  if (progress < 0 || progress > 1) return null
  const pose = flightPose(flight, progress)
  if (pose.opacity < 0.25) return null
  const angle = (pose.rotation * Math.PI) / 180
  const half = 8 * pose.scale * (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)))
  return { ...pose, half, behind: progress >= 0.55 }
}

export function flightsConflict(candidate: SleepFlight, other: SleepFlight) {
  const start = Math.max(candidate.start, other.start)
  const end = Math.min(candidate.start + candidate.duration, other.start + other.duration)
  let overlapSince: number | undefined
  for (let time = start; time <= end; time += 50) {
    const a = footprint(candidate, time)
    const b = footprint(other, time)
    let area = 0
    if (a && b) {
      const left = Math.max(a.x - a.half, b.x - b.half)
      const right = Math.min(a.x + a.half, b.x + b.half)
      const top = Math.max(a.y - a.half, b.y - b.half)
      const bottom = Math.min(a.y + a.half, b.y + b.half)
      // A 2px grid removes the part of the overlap covered by the photo.
      for (let x = left + 1; x < right; x += 2) {
        for (let y = top + 1; y < bottom; y += 2) {
          if (!(a.behind || b.behind) || Math.hypot(x, y) > 24) area += 4
        }
      }
      if (area > 0.2 * (2 * Math.min(a.half, b.half)) ** 2) {
        overlapSince ??= time
        if (time - overlapSince >= 100) return true
        continue
      }
    }
    overlapSince = undefined
  }
  return false
}

export function reserveFlight(flights: Map<number, SleepFlight>, slot: number, earliest: number) {
  flights.delete(slot)
  const others = [...flights.values()]
  // Try different curves first, then small delays. The last attempt starts
  // after all reservations end, which guarantees a bounded search.
  const latestEnd = Math.max(earliest, ...others.map((flight) => flight.start + flight.duration))
  for (let attempt = 0; attempt <= 24; attempt++) {
    const start = attempt === 24 ? latestEnd : earliest + Math.floor(attempt / 4) * 180
    const candidate = createFlight(start)
    if (!others.some((other) => flightsConflict(candidate, other))) {
      flights.set(slot, candidate)
      return candidate
    }
  }
  throw new Error('A non-overlapping sleep flight must be available after the last reservation')
}
