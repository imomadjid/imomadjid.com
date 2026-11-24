import { IconX } from '@tabler/icons-react'
import { useLocation } from '@tanstack/react-router'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'

import { LiveGlassSourceProvider } from '#/components/live-glass'
import { IconButton } from '#/components/ui/icon-button'
import type { LiveGlassSource } from '#/lib/live-glass-source'
import { cn } from '#/lib/utils'

import sceneFile from '../../tools/glass-live/Scenes/scenes.json'

// The live-glass fixture's scenes (tools/glass-live): each an iPhone 16 Pro screen with the
// Gallery's glass close button, laid out from the same scenes.json as the SwiftUI app, so a 3x
// capture of ?scene=<name> lines up pixel for pixel with the simulator's.
const patterns = import.meta.glob<string>('../../tools/glass-live/Scenes/*.png', {
  query: '?url',
  import: 'default',
  eager: true,
})
const photos = import.meta.glob<string>('../assets/gallery/*-640.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

type Scene = (typeof sceneFile.scenes)[number]

function fileUrl(file: string) {
  return file.endsWith('.png')
    ? patterns[`../../tools/glass-live/Scenes/${file}`]
    : photos[`../assets/gallery/${file}`]
}

export function LiveGlassFixture() {
  const params = new URLSearchParams(useLocation({ select: (location) => location.searchStr }))
  const capture = sceneFile.scenes.find((scene) => scene.name === params.get('scene'))
  if (capture?.motion)
    return (
      <MotionScene
        scene={capture}
        motion={capture.motion}
        icon={params.get('icon') !== '0'}
        scroll={Number(params.get('scroll') ?? 0)}
        run={params.get('run') === '1'}
      />
    )
  if (capture) return <CaptureScene scene={capture} icon={params.get('icon') !== '0'} />

  return (
    <div className="max-w-5xl space-y-10">
      <header className="space-y-1">
        <h1 className="text-display font-medium">Live glass</h1>
        <p className="text-body text-muted-foreground">
          IconButton and Button with glass=&quot;live&quot;: the backdrop refracted, frosted and
          toned on WebGPU, fitted to iOS 27 simulator captures of a 56 pt
          .glassEffect(.regular.interactive()) circle (tools/glass-live). Each scene opens alone
          with ?scene= for capture; add &amp;icon=0 for the bare glass the fit compares.
        </p>
      </header>
      <div className="flex flex-wrap gap-6">
        {sceneFile.scenes
          .filter((scene) => !/^(ramp|saw|step)/.test(scene.name))
          .map((scene) => (
            <figure key={scene.name} className="space-y-2">
              <a href={`?scene=${scene.name}`} className="block">
                <SceneFrame scene={scene} icon crop />
              </a>
              <figcaption className="text-caption text-muted-foreground">{scene.name}</figcaption>
            </figure>
          ))}
      </div>
    </div>
  )
}

/** One scene alone at the top left of the viewport, over the playground, for headless capture. */
function CaptureScene({ scene, icon }: { scene: Scene; icon: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: scene.background }}>
      <SceneFrame scene={scene} icon={icon} />
    </div>
  )
}

type Motion = NonNullable<Scene['motion']>

/**
 * A motion scene: its images in a real scroll container under the glass, so scrolling takes the
 * same path to the live glass as the Gallery overlay's. `scroll` sets the offset; `run` scrolls
 * at the scene's speed after its hold, as the SwiftUI app does, one step a frame.
 */
function MotionScene({
  scene,
  motion,
  icon,
  scroll,
  run,
}: {
  scene: Scene
  motion: Motion
  icon: boolean
  scroll: number
  run: boolean
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  // Scrolled by hand it leads as the overlay does; `run` scrolls on the main thread, in step.
  const source = useSceneSource(scrollerRef, true, !run)
  const { button } = scene

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollTop = scroll
    if (!run) return
    const start = performance.now()
    const end = motion.height - sceneFile.height
    let frame = requestAnimationFrame(function step(now) {
      const t = (now - start) / 1000 - motion.hold
      scroller.scrollTop = Math.min(end, Math.max(0, t * motion.speed))
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [motion, run, scroll])

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-[100] overflow-hidden',
        scene.scheme === 'dark' ? 'dark' : 'light',
      )}
      style={{ width: sceneFile.width, height: sceneFile.height, background: scene.background }}
    >
      <div
        ref={scrollerRef}
        data-background={scene.background}
        className="absolute inset-0 [scrollbar-width:none] overflow-y-auto"
      >
        <div className="relative" style={{ height: motion.height }}>
          {scene.images.map((image) => (
            <img
              key={`${image.file}@${image.x},${image.y}`}
              src={fileUrl(image.file)}
              alt=""
              decoding="async"
              className="absolute object-cover"
              style={{
                left: image.x,
                top: image.y,
                width: image.width,
                height: image.height,
                borderRadius: image.radius,
              }}
            />
          ))}
        </div>
      </div>
      <LiveGlassSourceProvider source={source}>
        <IconButton
          aria-label="Close"
          size="4xl"
          glass="live"
          className="absolute"
          style={{ left: button.x, top: button.y }}
        >
          {icon && <IconX aria-hidden="true" />}
        </IconButton>
      </LiveGlassSourceProvider>
    </div>
  )
}

/** A scene at its own size; `crop` shows just the 160 pt around the button. */
function SceneFrame({
  scene,
  icon,
  crop = false,
}: {
  scene: Scene
  icon: boolean
  crop?: boolean
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const source = useSceneSource(frameRef)
  const { button } = scene
  const cropSize = 160
  const view = crop
    ? {
        width: cropSize,
        height: cropSize,
        x: button.x + button.size / 2 - cropSize / 2,
        y: button.y + button.size / 2 - cropSize / 2,
      }
    : { width: sceneFile.width, height: sceneFile.height, x: 0, y: 0 }

  return (
    <div
      className={cn('relative overflow-hidden', scene.scheme === 'dark' ? 'dark' : 'light')}
      style={{ width: view.width, height: view.height, background: scene.background }}
    >
      <div
        ref={frameRef}
        data-background={scene.background}
        className="absolute"
        style={{
          width: sceneFile.width,
          height: sceneFile.height,
          left: -view.x,
          top: -view.y,
        }}
      >
        {scene.images.map((image) => (
          <img
            key={`${image.file}@${image.x},${image.y}`}
            src={fileUrl(image.file)}
            alt=""
            decoding="async"
            className="absolute object-cover"
            style={{
              left: image.x,
              top: image.y,
              width: image.width,
              height: image.height,
              borderRadius: image.radius,
            }}
          />
        ))}
        <LiveGlassSourceProvider source={source}>
          <IconButton
            aria-label="Close"
            size="4xl"
            glass="live"
            className="absolute"
            style={{ left: button.x, top: button.y }}
          >
            {icon && <IconX aria-hidden="true" />}
          </IconButton>
        </LiveGlassSourceProvider>
      </div>
    </div>
  )
}

function useSceneSource(
  frameRef: RefObject<HTMLDivElement | null>,
  scrolls = false,
  lead = false,
): LiveGlassSource {
  return useMemo(
    () => ({
      scene() {
        const frame = frameRef.current
        const images = [...(frame?.querySelectorAll('img') ?? [])]
        return {
          background: frame?.dataset.background ?? 'white',
          photos: images.map((image) => ({
            image,
            rect: image.getBoundingClientRect(),
            radius: Number.parseFloat(image.style.borderRadius) || 0,
          })),
        }
      },
      subscribe(wake) {
        const frame = frameRef.current
        if (!scrolls || !frame) return () => {}
        frame.addEventListener('scroll', wake, { passive: true })
        return () => frame.removeEventListener('scroll', wake)
      },
      scrolls: lead,
    }),
    [frameRef, scrolls, lead],
  )
}
