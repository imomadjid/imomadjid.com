import { Aperture, Component, GlassWater, Grid2x2, Image, Layers, LayoutGrid } from 'lucide-react'

// Single source for the /dev sidebar and the overview page.
export const devPages = [
  {
    to: '/dev',
    label: 'Overview',
    icon: LayoutGrid,
    description: 'Index of the local test pages.',
  },
  {
    to: '/dev/components',
    label: 'Components',
    icon: Component,
    description: 'Every installed Fluid Functionalism atom in each variant, size, and state.',
  },
  {
    to: '/dev/gallery-warp',
    label: 'Gallery warp',
    icon: Grid2x2,
    description: "Tune the See more tile's WebGPU warp, which zooms from the middle out.",
  },
  {
    to: '/dev/glass',
    label: 'Glass',
    icon: GlassWater,
    description: 'Static liquid glass on Button, matched against an iOS 26 capture.',
  },
  {
    to: '/dev/live-glass',
    label: 'Live glass',
    icon: Aperture,
    description: 'WebGPU liquid glass that refracts its backdrop, fitted to iOS 27 captures.',
  },
  {
    to: '/dev/og',
    label: 'Social card',
    icon: Image,
    description: 'The Open Graph image: the Sunlit wall with the logo, captured by tools/og.',
  },
  {
    to: '/dev/surfaces',
    label: 'Surfaces',
    icon: Layers,
    description: 'The eight-level surface and shadow ladder, with nested elevation.',
  },
] as const
