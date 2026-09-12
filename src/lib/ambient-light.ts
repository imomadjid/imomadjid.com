import { effect, frame, init, sampler, surface, target, timer } from 'vgpu'

import lightingSource from '../shaders/ambient-light.wgsl?raw'
import surfaceSource from '../shaders/ambient-surface.wgsl?raw'
import type { AmbientSettings } from './ambient-settings'
import { smoothStep, transitionTiming, transitionValue } from './ambient-transition'

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
  const profiling =
    import.meta.env.DEV && new URLSearchParams(location.search).has('ambientProfile')
  const adapter = profiling
    ? await navigator.gpu?.requestAdapter({ powerPreference: 'low-power' })
    : null
  const gpu = await init({
    powerPreference: 'low-power',
    requiredFeatures: adapter?.features.has('timestamp-query') ? ['timestamp-query'] : [],
  })
  let disposed = false
  let frameId = 0
  const cleanups: (() => void)[] = []

  function dispose() {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frameId)
    for (const cleanup of cleanups.reverse()) cleanup()
    gpu.dispose()
  }

  signal.addEventListener('abort', dispose, { once: true })
  cleanups.push(() => signal.removeEventListener('abort', dispose))
  try {
    if (signal.aborted) throw new DOMException('Preview closed', 'AbortError')
    let settings = initialSettings
    let ready = false
    let lastTime = 0
    let ambientTime = 0
    let transitionTime = 0
    let night = document.documentElement.classList.contains('dark') ? 1 : 0
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
    // Resolve the site's surface token through CSS, only on startup/theme changes.
    const readSurface = () => {
      const channels = getComputedStyle(host).backgroundColor.match(/[\d.]+/g)
      if (!channels || channels.length < 3) throw new Error('Cannot read surface color')
      return channels.slice(0, 3).map(Number)
    }
    let surfaceColor = readSurface()
    let fromSurface = surfaceColor
    let toSurface = surfaceColor
    let renderedFrames = 0
    let reportTime = 0
    const gpuSamples: number[] = []
    const frameSamples: number[] = []
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
    const output = surface(gpu, canvas, {
      autoResize: false,
      size: [Math.max(1, width * dpr()), Math.max(1, height * dpr())],
      alphaMode: 'opaque',
    })
    const lightTarget = target(gpu, {
      size: [Math.max(1, output.size[0] / 2), Math.max(1, output.size[1] / 2)],
      // Preserve irradiance above 1 until the material pass applies exposure.
      format: 'rgba16float',
    })
    const texture = gpu.gpu.createTexture({
      size: [1024, 1024],
      mipLevelCount: 5,
      format: 'rgba8unorm',
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
    const params = {
      time: 0,
      night,
      aspect: width / Math.max(height, 1),
      angle: settings.light.angle,
      softness: settings.light.softness,
      progressiveSoftness: settings.light.progressiveSoftness,
      opening: settings.blinds.opening,
      spacing: settings.blinds.spacing,
      railWidth: settings.blinds.railWidth,
      blindDepth: settings.blinds.distance,
      movement: settings.foliage.movement,
      density: settings.foliage.density,
      casterDepth: settings.foliage.depth,
      foliageScale: settings.foliage.scale,
      pointerX,
      pointerY,
      breezeX: 0,
      breezeY: 0,
      aimX,
      aimY,
      beamWidth: settings.light.beamWidth,
    }
    const material = {
      surfaceColor: surfaceColor.map((channel) => channel / 255),
      night,
      intensity: settings.light.intensity,
      warmth: settings.light.warmth,
      direction,
      entranceDawn: 0,
      entranceDusk: 0,
    }
    const lighting = effect(gpu, lightingSource, {
      label: 'sunlit-light',
      set: { params, foliage: texture, linearSampler },
    })
    const composite = effect(gpu, surfaceSource, {
      label: 'sunlit-material',
      set: { params: material, lighting: lightTarget, linearSampler },
    })

    function wake() {
      if (disposed || !ready || document.hidden || frameId) return
      frameId = requestAnimationFrame(draw)
    }

    function readTheme() {
      const resolved = document.documentElement.classList.contains('dark') ? 1 : 0
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
      output.resize([Math.max(1, width * dpr()), Math.max(1, height * dpr())])
      lightTarget.resize([Math.max(1, output.size[0] / 2), Math.max(1, output.size[1] / 2)])
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
      if (event.target instanceof Element && event.target.closest('[class*="dialkit"]')) {
        leavePointer()
        return
      }
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
      entrance = reducedMotion.matches
        ? 0
        : transitionValue(
            entranceFrom,
            0,
            entranceTime,
            entranceTiming.duration,
            entranceTiming.ease,
          )
      if (reducedMotion.matches) entranceFrom = 0
      night = reducedMotion.matches
        ? to
        : transitionValue(from, to, transitionTime, duration, easing)
      // Settle the dawn/sunset tint ahead of the light level, from its current tint on reversal.
      direction = reducedMotion.matches
        ? to
        : transitionValue(fromDirection, to, transitionTime, duration * 0.25, easing)
      surfaceColor = toSurface.map((channel, index) =>
        reducedMotion.matches
          ? channel
          : transitionValue(fromSurface[index], channel, transitionTime, duration, easing),
      )
      if (!reducedMotion.matches) ambientTime += delta * settings.foliage.speed
      const decay = Math.exp((-delta * 4) / settings.breeze.recovery)
      breezeX *= decay
      breezeY *= decay
      const follow = 1 - Math.exp(-delta * 22)
      bendX += (breezeX - bendX) * follow
      bendY += (breezeY - bendY) * follow
      if (reducedMotion.matches || settings.breeze.strength === 0) {
        breezeX = breezeY = bendX = bendY = 0
        pointerTime = 0
      }
      if (reducedMotion.matches) pointerActive = false
      const aimInfluence = pointerActive ? settings.light.pointerInfluence : 0
      const targetX = restingAimX + (aimTargetX - restingAimX) * aimInfluence
      const targetY = restingAimY + (aimTargetY - restingAimY) * aimInfluence
      const aimFollow = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * (pointerActive ? 5 : 2.5))
      aimX += (targetX - aimX) * aimFollow
      aimY += (targetY - aimY) * aimFollow
      const aimMoving = Math.hypot(targetX - aimX, targetY - aimY) > 0.0001
      if (!aimMoving) {
        aimX = targetX
        aimY = targetY
      }
      Object.assign(params, {
        time: ambientTime,
        night,
        aspect: width / Math.max(height, 1),
        angle: settings.light.angle + entrance * (entranceNight ? -8 : 6),
        softness: settings.light.softness,
        progressiveSoftness: settings.light.progressiveSoftness,
        opening: settings.blinds.opening,
        spacing: settings.blinds.spacing,
        railWidth: settings.blinds.railWidth,
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
      Object.assign(material, {
        surfaceColor: surfaceColor.map((channel) => channel / 255),
        night,
        direction,
        intensity: settings.light.intensity,
        warmth: settings.light.warmth,
        entranceDawn: entrance * (1 - entranceNight),
        entranceDusk: entrance * entranceNight,
      })
      lighting.set({ params })
      composite.set({ params: material })
      try {
        frame(gpu, (current) => {
          current.pass({ target: lightTarget, timer: lightSpan }, (pass) => pass.draw(lighting))
          current.pass({ target: output, timer: materialSpan }, (pass) => pass.draw(composite))
        })
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error))
        return
      }
      // Match the material's dusk curve; update DOM only at a foreground crossover.
      const tone = smoothStep((night - 0.45) / 0.55) > 0.55 ? 'night' : 'day'
      if (host.dataset.sceneTone !== tone) host.dataset.sceneTone = tone
      if (canvas.dataset.renderer !== 'webgpu') canvas.dataset.renderer = 'webgpu'
      renderedFrames += 1
      if (import.meta.env.DEV && now - reportTime > 1000) {
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
      if (
        !reducedMotion.matches &&
        (moving || gustMoving || aimMoving || night !== to || entrance > 0)
      )
        wake()
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
    document.addEventListener('visibilitychange', pauseWhenHidden)
    cleanups.push(() => document.removeEventListener('visibilitychange', pauseWhenHidden))
    window.addEventListener('resize', resize)
    cleanups.push(() => window.removeEventListener('resize', resize))
    window.addEventListener('pointermove', movePointer, { passive: true })
    cleanups.push(() => window.removeEventListener('pointermove', movePointer))
    document.documentElement.addEventListener('pointerleave', leavePointer)
    cleanups.push(() => document.documentElement.removeEventListener('pointerleave', leavePointer))
    window.addEventListener('blur', leavePointer)
    cleanups.push(() => window.removeEventListener('blur', leavePointer))
    reducedMotion.addEventListener('change', wake)
    cleanups.push(() => reducedMotion.removeEventListener('change', wake))

    function fail(message: string) {
      if (disposed) return
      console.error('Sunlit renderer stopped:', message)
      canvas.dataset.renderer = 'fallback'
      delete host.dataset.sceneTone
      dispose()
    }

    gpu.onError((error) => fail(error.message))
    void gpu.gpu.lost.then((info) => fail(info.message))
    const image = new Image()
    image.src = '/ambient/foliage.svg'
    await image.decode()
    if (disposed) throw new DOMException('Preview closed', 'AbortError')
    const mask = document.createElement('canvas')
    mask.width = 1024
    mask.height = 1024
    const context = mask.getContext('2d')
    if (!context) throw new Error('Cannot prepare foliage mask')
    // Filter each ray's finite footprint in the opacity mask, rather than add
    // random grain to hide undersampling in broad penumbrae.
    for (let mipLevel = 0; mipLevel < 5; mipLevel += 1) {
      const size = 1024 >> mipLevel
      mask.width = size
      mask.height = size
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, size, size)
      gpu.gpu.queue.copyExternalImageToTexture({ source: mask }, { texture, mipLevel }, [
        size,
        size,
      ])
    }
    await Promise.all([
      lighting.compile({ colors: [lightTarget.format] }),
      composite.compile({ colors: [output.format] }),
    ])
    if (disposed) throw new DOMException('Preview closed', 'AbortError')
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
