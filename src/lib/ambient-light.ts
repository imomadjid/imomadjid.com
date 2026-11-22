import { effect, frame, init, sampler, surface, target, timer } from 'vgpu'

import lightingSource from '#/shaders/ambient-light.wgsl'
import surfaceSource from '#/shaders/ambient-surface.wgsl'

import type { AmbientSettings } from './ambient-settings'
import { smoothStep, transitionTiming, transitionValue } from './ambient-transition'
import { sceneLight, wandPose } from './sunlit-scene'

const FOLIAGE_SIZE = 1024
const FOLIAGE_MIPS = 5
const MAX_LIGHT_PIXELS = 960 * 540
// Distance in CSS pixels between the text column and the blind rail's shadow.
const RAIL_MARGIN = 56

export type AmbientRenderer = {
  update: (settings: AmbientSettings) => void
  dispose: () => void
}

export async function startAmbient(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  initialSettings: AmbientSettings,
  signal: AbortSignal,
): Promise<AmbientRenderer> {
  // Fetch and decode the foliage mask while the GPU device initializes.
  const image = new Image()
  image.src = '/ambient/foliage.svg'
  const decoded = image.decode()
  decoded.catch(() => {})
  const profiling =
    import.meta.env.DEV_TOOLS && new URLSearchParams(location.search).has('ambientProfile')
  const adapter = profiling
    ? await navigator.gpu?.requestAdapter({ powerPreference: 'low-power' })
    : null
  const gpu = await init({
    powerPreference: 'low-power',
    requiredFeatures: adapter?.features.has('timestamp-query') ? ['timestamp-query'] : [],
  })
  let disposed = false
  let frameId = 0
  const listeners = new AbortController()
  const cleanups: (() => void)[] = [() => listeners.abort()]
  const assertLive = () => {
    if (disposed || signal.aborted)
      throw new DOMException('Ambient renderer disposed', 'AbortError')
  }

  function dispose() {
    if (disposed) return
    disposed = true
    sceneLight.set(null)
    host.style.removeProperty('background-color')
    cancelAnimationFrame(frameId)
    for (const cleanup of cleanups.reverse()) cleanup()
    gpu.dispose()
  }

  signal.addEventListener('abort', dispose, { once: true, signal: listeners.signal })
  try {
    assertLive()
    const isDark = () => (document.documentElement.classList.contains('dark') ? 1 : 0)
    let settings = initialSettings
    let ready = false
    let lastTime = 0
    let ambientTime = 0
    let transitionTime = 0
    let night = isDark()
    let from = night
    let to = night
    let direction = night
    let fromDirection = direction
    let duration = 0
    let easing = smoothStep
    // Entrance lighting never changes the selected theme or its foreground color.
    const entranceNight = night
    let entranceTime = 0
    let entranceFrom = 1
    let entrance = 1
    let entranceTiming = transitionTiming(
      night ? settings.transition.duskEntrance : settings.transition.dawnEntrance,
    )
    // The canvas paints the surface token without a transition, so this reads the
    // destination color on theme changes rather than an in-flight value.
    const readSurface = () => {
      const channels = getComputedStyle(canvas).backgroundColor.match(/[\d.]+/g)
      if (!channels || channels.length < 3) throw new Error('Cannot read surface color')
      return channels.slice(0, 3).map(Number)
    }
    let surfaceColor = readSurface()
    let paintedBackdrop = ''
    let fromSurface = surfaceColor
    let toSurface = surfaceColor
    let renderedFrames = 0
    let reportTime = 0
    const gpuSamples: number[] = []
    const frameSamples: number[] = []
    // The build-time profiling constant lets production drop the timer code.
    const gpuTimer = profiling && gpu.gpu.features.has('timestamp-query') ? timer(gpu) : undefined
    const lightSpan = gpuTimer?.span('light')
    const materialSpan = gpuTimer?.span('material')
    gpuTimer?.onResults((spans) => {
      gpuSamples.push(spans.light + spans.material)
      if (gpuSamples.length > 300) gpuSamples.shift()
    })
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(any-pointer: fine)')
    let pointerX = 0.8
    let pointerY = 0.5
    let pointerTime = 0
    let previousX = 0
    let previousY = 0
    let breezeX = 0
    let breezeY = 0
    let bendX = 0
    let bendY = 0
    const restingAimX = 1.08
    const restingAimY = 0.45
    let aimX = restingAimX
    let aimY = restingAimY
    let aimTargetX = restingAimX
    let aimTargetY = restingAimY
    let pointerActive = false
    const rect = canvas.getBoundingClientRect()
    let width = rect.width
    let height = rect.height
    const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5)
    // Keep the rail shadow clear of the text column; omit it when the wall has no room.
    const anchor = host.querySelector('[data-sunlit-anchor]')
    let railX = 0
    const placeRail = () => {
      if (!anchor || width <= 0) {
        railX = 0
        return
      }
      const left = canvas.getBoundingClientRect().left
      const shadow = anchor.getBoundingClientRect().right - left + RAIL_MARGIN
      railX = shadow <= width - RAIL_MARGIN ? shadow / width : 0
    }
    placeRail()
    // vgpu requires whole-pixel target sizes.
    const pixels = (value: number) => Math.max(1, Math.round(value))
    const outputSize = (): [number, number] => [pixels(width * dpr()), pixels(height * dpr())]
    // Light is smooth, so cap its target near 960x540; larger targets cost GPU time for
    // differences of a few 8-bit levels.
    const lightSize = (): [number, number] => {
      const [outputWidth, outputHeight] = output.size
      const scale = Math.min(0.5, Math.sqrt(MAX_LIGHT_PIXELS / (outputWidth * outputHeight)))
      return [pixels(outputWidth * scale), pixels(outputHeight * scale)]
    }
    const output = surface(gpu, canvas, {
      autoResize: false,
      size: outputSize(),
      alphaMode: 'opaque',
    })
    const lightTarget = target(gpu, {
      size: lightSize(),
      // Visibility and irradiance only; float preserves irradiance above 1 for exposure.
      format: 'rg16float',
    })
    const texture = gpu.gpu.createTexture({
      size: [FOLIAGE_SIZE, FOLIAGE_SIZE],
      mipLevelCount: FOLIAGE_MIPS,
      // The shader reads coverage from the red channel only.
      format: 'r8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    })
    const linearSampler = sampler(gpu, {
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
    })
    const wandParams = () => {
      const pose = wandPose.get()
      return {
        wandX: pose?.x ?? 0,
        wandY: pose?.y ?? 0,
        wandAngle: pose?.angle ?? 0,
        wandDepth: settings.wand.depth,
        wandHang: pose?.hang ?? 0,
        wandTipStart: pose?.tipStart ?? 0,
        wandTipWidth: pose?.tipWidth ?? 0,
        wandTipCorner: pose?.tipCorner ?? 0,
        wandTaperStart: pose?.taperStart ?? 0,
        wandRodStart: pose?.rodStart ?? 0,
        wandHoleY: pose?.holeY ?? 0,
        wandHoleWidth: pose?.holeWidth ?? 0,
        wandHoleHeight: pose?.holeHeight ?? 0,
        wandLength: pose?.length ?? 0,
        wandRadius: pose?.radius ?? 0,
      }
    }
    const lightParams = () => ({
      ...wandParams(),
      time: ambientTime,
      night,
      aspect: width / Math.max(height, 1),
      angle: settings.light.angle + entrance * (entranceNight ? -8 : 6),
      softness: settings.light.softness,
      progressiveSoftness: settings.light.progressiveSoftness,
      opening: settings.blinds.opening,
      spacing: settings.blinds.spacing,
      railWidth: railX > 0 ? settings.blinds.railWidth : 0,
      railX,
      blindDepth: settings.blinds.distance,
      movement: settings.foliage.movement,
      density: settings.foliage.density,
      casterDepth: settings.foliage.depth,
      foliageScale: settings.foliage.scale,
      pointerX,
      pointerY,
      breezeX: -bendX,
      breezeY: -bendY,
      aimX,
      aimY,
      beamWidth: settings.light.beamWidth,
    })
    const materialParams = () => ({
      surfaceColor: surfaceColor.map((channel) => channel / 255),
      night,
      intensity: settings.light.intensity,
      warmth: settings.light.warmth,
      direction,
      entranceDawn: entrance * (1 - entranceNight),
      entranceDusk: entrance * entranceNight,
      overlay: settings.content.lit ? 1 : 0,
    })
    const lighting = effect(gpu, lightingSource, {
      label: 'sunlit-light',
      set: { params: lightParams(), foliage: texture, linearSampler },
    })
    const composite = effect(gpu, surfaceSource, {
      label: 'sunlit-material',
      set: { params: materialParams(), lighting: lightTarget, linearSampler },
    })

    function wake() {
      if (disposed || !ready || document.hidden || frameId) return
      frameId = requestAnimationFrame(draw)
    }

    function readTheme() {
      const resolved = isDark()
      if (resolved === to) return
      // Hand off an unfinished entrance without snapping its tint or geometry.
      entranceFrom = entrance
      entranceTime = 0
      entranceTiming = { duration: 0.35, ease: smoothStep }
      from = night
      to = resolved
      fromDirection = direction
      fromSurface = surfaceColor
      toSurface = readSurface()
      transitionTime = 0
      const timing = transitionTiming(
        to ? settings.transition.sunsetMotion : settings.transition.sunriseMotion,
      )
      duration = Math.abs(to - from) * timing.duration
      easing = timing.ease
      wake()
    }

    function resize() {
      if (disposed) return
      placeRail()
      output.resize(outputSize())
      lightTarget.resize(lightSize())
      composite.set({ lighting: lightTarget })
      wake()
    }

    function pauseWhenHidden() {
      cancelAnimationFrame(frameId)
      frameId = 0
      lastTime = 0
      pointerTime = 0
      pointerActive = false
      breezeX = breezeY = bendX = bendY = 0
      wake()
    }

    function movePointer(event: PointerEvent) {
      if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return
      const bounds = canvas.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1)
      const y = (event.clientY - bounds.top) / Math.max(bounds.height, 1)
      pointerActive = true
      aimTargetX = Math.max(0, Math.min(1, x))
      aimTargetY = Math.max(0, Math.min(1, y))
      const elapsed = (event.timeStamp - pointerTime) / 1000
      if (pointerTime && elapsed > 0 && elapsed < 0.15) {
        const strength = settings.breeze.strength
        breezeX = Math.max(-0.045, Math.min(0.045, breezeX + (x - previousX) * strength * 0.22))
        breezeY = Math.max(-0.045, Math.min(0.045, breezeY + (y - previousY) * strength * 0.22))
      }
      // Retain the gust origin until it settles, avoiding a jump on pointer re-entry.
      if (Math.hypot(bendX, bendY) < 0.001 || pointerTime) {
        pointerX = x
        pointerY = y
      }
      previousX = x
      previousY = y
      pointerTime = event.timeStamp
      wake()
    }

    function leavePointer() {
      pointerTime = 0
      pointerActive = false
      wake()
    }

    function draw(now: number) {
      frameId = 0
      if (disposed || document.hidden) return
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0
      if (profiling && lastTime) {
        frameSamples.push(now - lastTime)
        if (frameSamples.length > 300) frameSamples.shift()
      }
      lastTime = now
      transitionTime += delta
      entranceTime += delta
      const still = reducedMotion.matches
      if (still) {
        entrance = entranceFrom = 0
        night = direction = to
        surfaceColor = toSurface
        pointerActive = false
      } else {
        const { duration: entranceDuration, ease: entranceEase } = entranceTiming
        entrance = transitionValue(entranceFrom, 0, entranceTime, entranceDuration, entranceEase)
        night = transitionValue(from, to, transitionTime, duration, easing)
        // Settle the dawn/sunset tint ahead of the light level, from its current tint on reversal.
        direction = transitionValue(fromDirection, to, transitionTime, duration * 0.25, easing)
        surfaceColor = toSurface.map((channel, index) =>
          transitionValue(fromSurface[index], channel, transitionTime, duration, easing),
        )
        ambientTime += delta * settings.foliage.speed
      }
      const decay = Math.exp((-delta * 4) / settings.breeze.recovery)
      breezeX *= decay
      breezeY *= decay
      const follow = 1 - Math.exp(-delta * 22)
      bendX += (breezeX - bendX) * follow
      bendY += (breezeY - bendY) * follow
      if (still || settings.breeze.strength === 0) {
        breezeX = breezeY = bendX = bendY = 0
        pointerTime = 0
      }
      const aimInfluence = pointerActive ? settings.light.pointerInfluence : 0
      const targetX = restingAimX + (aimTargetX - restingAimX) * aimInfluence
      const targetY = restingAimY + (aimTargetY - restingAimY) * aimInfluence
      const aimFollow = still ? 1 : 1 - Math.exp(-delta * (pointerActive ? 5 : 2.5))
      aimX += (targetX - aimX) * aimFollow
      aimY += (targetY - aimY) * aimFollow
      const aimMoving = Math.hypot(targetX - aimX, targetY - aimY) > 0.0001
      if (!aimMoving) {
        aimX = targetX
        aimY = targetY
      }
      lighting.set({ params: lightParams() })
      composite.set({ params: materialParams() })
      // Over the content, the light layer is encoded against the plain surface beneath it, so
      // paint that surface in step with the surface the shader reads, through theme changes.
      const backdrop = settings.content.lit
        ? `rgb(${surfaceColor.map((channel) => channel.toFixed(2)).join(' ')})`
        : ''
      if (backdrop !== paintedBackdrop) {
        host.style.backgroundColor = backdrop
        paintedBackdrop = backdrop
      }
      try {
        frame(gpu, (current) => {
          current.pass({ target: lightTarget, timer: lightSpan }, (pass) => pass.draw(lighting))
          current.pass({ target: output, timer: materialSpan }, (pass) => pass.draw(composite))
        })
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error))
        return
      }
      sceneLight.set({
        night,
        direction,
        entrance,
        entranceNight,
        aimX,
        aimY,
        surface: [surfaceColor[0] / 255, surfaceColor[1] / 255, surfaceColor[2] / 255],
      })
      // Match the material's dusk curve; update DOM only at a foreground crossover.
      const tone = smoothStep((night - 0.45) / 0.55) > 0.55 ? 'night' : 'day'
      if (host.dataset.sceneTone !== tone) host.dataset.sceneTone = tone
      if (canvas.dataset.renderer !== 'webgpu') canvas.dataset.renderer = 'webgpu'
      renderedFrames += 1
      if (import.meta.env.DEV_TOOLS && now - reportTime > 1000) {
        canvas.dataset.frames = String(renderedFrames)
        canvas.dataset.phase = night.toFixed(3)
        canvas.dataset.entrance = entrance.toFixed(3)
        if (profiling) {
          const gpuSorted = [...gpuSamples].sort((a, b) => a - b)
          const frameSorted = [...frameSamples].sort((a, b) => a - b)
          canvas.dataset.gpuMedianMs = gpuSorted[Math.floor(gpuSorted.length * 0.5)]?.toFixed(3)
          canvas.dataset.gpuP95Ms = gpuSorted[Math.floor(gpuSorted.length * 0.95)]?.toFixed(3)
          canvas.dataset.frameP95Ms = frameSorted[Math.floor(frameSorted.length * 0.95)]?.toFixed(2)
        }
        reportTime = now
      }
      const moving =
        settings.foliage.speed > 0 && settings.foliage.movement > 0 && settings.foliage.density > 0
      const gustMoving = Math.hypot(bendX, bendY, breezeX, breezeY) > 0.00001
      if (!still && (moving || gustMoving || aimMoving || night !== to || entrance > 0)) wake()
      else lastTime = 0
    }

    const themeObserver = new MutationObserver(readTheme)
    cleanups.push(() => themeObserver.disconnect())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry || disposed) return
      width = entry.contentRect.width
      height = entry.contentRect.height
      resize()
    })
    cleanups.push(() => resizeObserver.disconnect())
    resizeObserver.observe(canvas)
    const options = { signal: listeners.signal }
    document.addEventListener('visibilitychange', pauseWhenHidden, options)
    // Window resize also covers DPR changes from zoom, which ResizeObserver misses.
    window.addEventListener('resize', resize, options)
    // Scope pointer input to the scene; portaled overlays such as DialKit fire pointerleave.
    host.addEventListener('pointermove', movePointer, { ...options, passive: true })
    host.addEventListener('pointerleave', leavePointer, options)
    window.addEventListener('blur', leavePointer, options)
    reducedMotion.addEventListener('change', wake, options)
    // Redraw the wand's shadow as it swings.
    cleanups.push(wandPose.subscribe(wake))

    function fail(message: string) {
      if (disposed) return
      console.error('Sunlit renderer stopped:', message)
      canvas.dataset.renderer = 'fallback'
      delete host.dataset.sceneTone
      dispose()
    }

    gpu.onError((error) => fail(error.message))
    void gpu.gpu.lost.then((info) => fail(info.message))
    const compiled = Promise.all([
      lighting.compile({ colors: [lightTarget.format] }),
      composite.compile({ colors: [output.format] }),
    ])
    compiled.catch(() => {})
    await decoded
    assertLive()
    const mask = document.createElement('canvas')
    const context = mask.getContext('2d')
    if (!context) throw new Error('Cannot prepare foliage mask')
    // Filter each ray's finite footprint in the opacity mask, rather than add
    // random grain to hide undersampling in broad penumbrae.
    for (let mipLevel = 0; mipLevel < FOLIAGE_MIPS; mipLevel += 1) {
      const size = FOLIAGE_SIZE >> mipLevel
      mask.width = size
      mask.height = size
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, size, size)
      gpu.gpu.queue.copyExternalImageToTexture({ source: mask }, { texture, mipLevel }, [
        size,
        size,
      ])
    }
    await compiled
    assertLive()
    ready = true
    wake()
    return {
      update(nextSettings) {
        settings = nextSettings
        wake()
      },
      dispose,
    }
  } catch (error) {
    dispose()
    throw error
  }
}
