import { ArrowRight, Plus, Settings } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export function GlassFixture() {
  return (
    <div className="max-w-5xl space-y-14">
      <header className="space-y-1">
        <h1 className="text-display font-medium">Glass</h1>
        <p className="text-body text-muted-foreground">
          The Button glass prop. Static glass is matched against an iOS 26 tab bar capture; live
          glass (backdrop refraction) is not built yet.
        </p>
      </header>

      <section className="space-y-5">
        <h2 className="border-b border-border pb-2 text-title font-medium">Reference match</h2>
        <p className="text-body text-muted-foreground">
          Two frames matching the iOS 26 captures, white (393 × 108) and #f2f1f6 (393 × 93.67), with
          the glass surface at the captured 352 × 63 geometry. Headless 3x captures of both are
          diffed against the references.
        </p>
        <div data-glass-capture inert className="relative h-[108px] w-[393px] bg-white">
          <Button
            glass="static"
            aria-label="Glass reference surface"
            className="absolute top-[23.85px] left-[20.483px] h-[63.1px] w-[352.033px] rounded-full p-0"
          />
        </div>
        <div
          data-glass-capture="grey"
          inert
          className="relative h-[93.667px] w-[393px] bg-[rgb(242_241_246)]"
        >
          <Button
            glass="static"
            aria-label="Glass reference surface"
            className="absolute top-[9.95px] left-[20.483px] h-[63.1px] w-[352.033px] rounded-full p-0"
          />
        </div>
        <p className="text-body text-muted-foreground">
          Dark mode: #1c1c1e (393 × 96.67) and black (393 × 98.67), surface at 351 × 62. The
          <code> dark</code> class on each frame applies the dark glass tokens.
        </p>
        <div
          data-glass-capture="dark"
          inert
          className="dark relative h-[96.667px] w-[393px] bg-[rgb(28_28_30)]"
        >
          <Button
            glass="static"
            aria-label="Glass reference surface"
            className="absolute top-[13.667px] left-[21px] h-[62px] w-[351px] rounded-full p-0"
          />
        </div>
        <div
          data-glass-capture="black"
          inert
          className="dark relative h-[98.667px] w-[393px] bg-black"
        >
          <Button
            glass="static"
            aria-label="Glass reference surface"
            className="absolute top-[15.667px] left-[21px] h-[62px] w-[351px] rounded-full p-0"
          />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="border-b border-border pb-2 text-title font-medium">Tinted reference</h2>
        <p className="text-body text-muted-foreground">
          tint-* over static glass, in the geometry of the iOS 27 simulator captures from
          tools/glass-tints (capture.sh, effect style). Each frame's top-left pixel is a magenta
          marker for locating it in 3x headless captures.
        </p>
        <div className="flex flex-wrap gap-6">
          {tintBackdrops.map((backdrop) => (
            <div key={backdrop.name} className="space-y-1">
              <p className="text-caption text-muted-foreground">{backdrop.name}</p>
              {tintSwatches.map((swatch) => (
                <div
                  key={swatch.name}
                  data-tint-capture={`${backdrop.name}-${swatch.name}`}
                  inert
                  className={cn('relative h-[108px] w-[393px]', backdrop.className)}
                >
                  <span className="absolute top-0 left-0 size-px bg-[rgb(255_0_255)]" />
                  <Button
                    glass="static"
                    aria-label={`${swatch.name} tinted glass`}
                    className={cn(
                      'absolute top-[23.85px] left-[20.483px] h-[63.1px] w-[352.033px] rounded-full p-0',
                      swatch.full,
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="border-b border-border pb-2 text-title font-medium">Tinted buttons</h2>
        <p className="text-body text-muted-foreground">
          The same tint-* class with glass on and off, at a strong and a light palette step.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            'bg-white',
            'bg-surface-1',
            'bg-[linear-gradient(120deg,#f97316,#ec4899_45%,#6366f1)]',
          ].map((backdrop) => (
            <div key={backdrop} className={cn('space-y-3 rounded-xl p-6', backdrop)}>
              {tintSwatches.map((swatch) => (
                <div key={swatch.name} className="flex flex-wrap items-center gap-3">
                  <Button glass="static" className={cn('rounded-full', swatch.full)}>
                    Glass
                  </Button>
                  <Button glass="static" className={cn('rounded-full', swatch.light)}>
                    Glass light
                  </Button>
                  <Button className={cn('rounded-full', swatch.full)}>Solid</Button>
                  <Button className={cn('rounded-full', swatch.light)}>Solid light</Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="border-b border-border pb-2 text-title font-medium">Static glass buttons</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <GlassRow backdrop="bg-white" label="On white" />
          <GlassRow backdrop="bg-surface-1" label="On page background" />
          <GlassRow
            backdrop="bg-[linear-gradient(120deg,#f97316,#ec4899_45%,#6366f1)]"
            label="On color"
          />
          <GlassRow backdrop="bg-[url(/og.jpg)] bg-cover bg-center" label="On an image" />
        </div>
      </section>
    </div>
  )
}

function GlassRow({ backdrop, label }: { backdrop: string; label: string }) {
  return (
    <figure className="space-y-2">
      <div className={`flex flex-wrap items-center gap-3 rounded-xl p-6 ${backdrop}`}>
        <Button glass="static" className="rounded-full">
          Glass
        </Button>
        <Button glass="static" leadingIcon={Plus} className="rounded-full">
          New
        </Button>
        <Button glass="static" trailingIcon={ArrowRight} size="compact" className="rounded-full">
          Next
        </Button>
        <Button glass="static" size="icon" aria-label="Settings" className="rounded-full">
          <Settings />
        </Button>
      </div>
      <figcaption className="text-caption text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

// Literal classes so Tailwind emits them; order matches the simulator capture order.
const tintSwatches = [
  { name: 'red-500', full: 'tint-red-500', light: 'tint-red-100' },
  { name: 'amber-500', full: 'tint-amber-500', light: 'tint-amber-100' },
  { name: 'green-500', full: 'tint-green-500', light: 'tint-green-100' },
  { name: 'blue-600', full: 'tint-blue-600', light: 'tint-blue-100' },
]

const tintBackdrops = [
  { name: 'white', className: 'bg-white' },
  { name: 'grey', className: 'bg-[rgb(242_241_246)]' },
  { name: 'dark', className: 'dark bg-[rgb(28_28_30)]' },
  { name: 'black', className: 'dark bg-black' },
]
