import {
  Aperture,
  BookOpen,
  Clapperboard,
  Component,
  GlassWater,
  Grid2x2,
  Image,
  Layers,
  LayoutGrid,
  MapPin,
  Stamp,
} from 'lucide-react'

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
    to: '/dev/guestbook',
    label: 'Guestbook pile',
    icon: BookOpen,
    description:
      "The Guestbook's pile of postmarks under the footer, filled with made-up visitors.",
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
    to: '/dev/postmarks',
    label: 'Postmarks',
    icon: MapPin,
    description:
      'Passport-style Guestbook postmarks, one design per place and a print per visitor.',
  },
  {
    to: '/dev/stamps',
    label: 'Stamps',
    icon: Stamp,
    description: 'Pick the Guestbook stamps from what Wikimedia Commons lists per country.',
  },
  {
    to: '/dev/story',
    label: 'Story',
    icon: Clapperboard,
    description: 'The Sunlit wall in portrait, from day to night, recorded by tools/story.',
  },
  {
    to: '/dev/surfaces',
    label: 'Surfaces',
    icon: Layers,
    description: 'The eight-level surface and shadow ladder, with nested elevation.',
  },
] as const
