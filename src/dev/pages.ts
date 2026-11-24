import { Component, GlassWater, Grid2x2, Layers, LayoutGrid } from 'lucide-react'

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
    description: 'The See more tile in WebGPU, zooming from the middle out.',
  },
  {
    to: '/dev/glass',
    label: 'Glass',
    icon: GlassWater,
    description: 'Static liquid glass on Button, matched against an iOS 26 capture.',
  },
  {
    to: '/dev/surfaces',
    label: 'Surfaces',
    icon: Layers,
    description: 'The eight-level surface and shadow ladder, with nested elevation.',
  },
] as const
