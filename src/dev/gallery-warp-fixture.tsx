import { useEffect, useMemo, useRef, useState } from 'react'

import { featuredCount, galleryPhotos } from '#/lib/gallery'
import { galleryTuning } from '#/lib/gallery-settings'
import { startGalleryWarp } from '#/lib/gallery-warp'
import type { GalleryWarp, WarpTuning } from '#/lib/gallery-warp'
import { easing } from '#/lib/transition'

const { seeMore } = galleryTuning

// The warp's sliders: each one's label, range and step.
const sliders = {
  duration: ['Seconds per move', 0.1, 1.5, 0.05],
  lead: ['Seconds the corners start after the middle', 0, 0.6, 0.01],
  bulge: ['Extra magnification of the middle halfway', 0, 0.5, 0.01],
} as const

// The See more tile's preview order: the photos past the grid, then from the top.
const photoUrls = [...galleryPhotos.slice(featuredCount), ...galleryPhotos.slice(0, featuredCount)]
  .slice(0, 16)
  .map((photo) => photo.thumb)

const sizes = [176, 352] as const

function WarpTile({ size, tuning, pinned }: { size: number; tuning: WarpTuning; pinned: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const warpRef = useRef<GalleryWarp | null>(null)
  const tuningRef = useRef(tuning)
  const zoomedOutRef = useRef(false)
  const [hovered, setHovered] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // Declared before the start effect, so the renderer starts with the current tuning.
  useEffect(() => {
    tuningRef.current = tuning
    warpRef.current?.update(tuning)
  }, [tuning])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const controller = new AbortController()
    startGalleryWarp(canvas, photoUrls, tuningRef.current, controller.signal, (error) => {
      warpRef.current = null
      setFailure(String(error))
    })
      .then((warp) => {
        warpRef.current = warp
        warp.setZoomedOut(zoomedOutRef.current)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setFailure(String(error))
      })
    return () => {
      controller.abort()
      warpRef.current = null
    }
  }, [])

  useEffect(() => {
    zoomedOutRef.current = hovered || pinned
    warpRef.current?.setZoomedOut(zoomedOutRef.current)
  }, [hovered, pinned])

  return (
    <figure className="space-y-2">
      <button
        type="button"
        aria-label={`Warp tile at ${size}px`}
        className="focus-visible:ring-ring relative block cursor-pointer rounded-xl outline-none focus-visible:ring-2"
        style={{ width: size, height: size }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={(event) => setHovered(event.currentTarget.matches(':focus-visible'))}
        onBlur={() => setHovered(false)}
      >
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      </button>
      <figcaption className="text-caption text-muted-foreground">
        {failure ?? `${size} × ${size}`}
      </figcaption>
    </figure>
  )
}

export function GalleryWarpFixture() {
  const [values, setValues] = useState({
    duration: seeMore.motion.duration,
    lead: seeMore.lead,
    bulge: seeMore.bulge,
  })
  // Holds every tile zoomed out, to inspect the grid.
  const [zoomedOut, setZoomedOut] = useState(false)
  const tuning: WarpTuning = useMemo(
    () => ({
      motion: easing(values.duration, seeMore.motion.ease),
      lead: values.lead,
      bulge: values.bulge,
    }),
    [values],
  )

  return (
    <div className="max-w-5xl space-y-14">
      <header className="space-y-1">
        <h1 className="text-display font-medium">Gallery warp</h1>
        <p className="text-body text-muted-foreground">
          The homepage's See more tile, drawn with WebGPU. Hover a tile: the middle of the grid
          zooms before the edges, ring by ring. Tune it with the sliders, then copy the values into
          src/lib/gallery-settings.ts; at zero lead and bulge it moves like the CSS fallback.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-6">
        {(['duration', 'lead', 'bulge'] as const).map((key) => {
          const [label, min, max, step] = sliders[key]
          return (
            <label key={key} className="flex flex-col gap-1 text-caption text-muted-foreground">
              {`${label}: ${values[key]}`}
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={values[key]}
                className="w-56 accent-foreground"
                onChange={(event) =>
                  setValues((current) => ({ ...current, [key]: Number(event.target.value) }))
                }
              />
            </label>
          )
        })}
        <label className="flex items-center gap-2 text-caption text-muted-foreground">
          <input
            type="checkbox"
            checked={zoomedOut}
            className="accent-foreground"
            onChange={(event) => setZoomedOut(event.target.checked)}
          />
          Hold zoomed out
        </label>
      </div>

      <section className="flex flex-wrap items-end gap-10">
        {sizes.map((size) => (
          <WarpTile key={size} size={size} tuning={tuning} pinned={zoomedOut} />
        ))}
      </section>
    </div>
  )
}
