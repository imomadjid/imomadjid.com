import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { DialRoot } from 'dialkit'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { ShapeProvider } from '#/lib/shape-context'
import { SurfaceProvider } from '#/lib/surface-context'
import { textLinkClass } from '#/lib/text-link'
import { THEME_SCRIPT, useTheme } from '#/lib/theme'
import { warmSoundsOnGesture } from '#/lib/ui-sound'
import { cn } from '#/lib/utils'

import appCss from '#/styles.css?url'
import dialkitCss from 'dialkit/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Imo Madjid' },
      // The dev site, a copy of production, stays out of search results.
      ...(import.meta.env.DEV_TOOLS ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
    links: [
      ...(import.meta.env.DEV_TOOLS ? [{ rel: 'stylesheet', href: dialkitCss }] : []),
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'preload',
        href: '/fonts/allo/AlloVariableFriendly.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-base font-normal">This page doesn’t exist.</h1>
      <Link to="/" className={cn('text-sm', textLinkClass)}>
        Back to the homepage
      </Link>
    </main>
  )
}

function ThemedDialKit() {
  return <DialRoot theme={useTheme()} defaultOpen={false} />
}

function RootDocument({ children }: { children: ReactNode }) {
  useEffect(warmSoundsOnGesture, [])
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The script inlines a function's compiled source, which differs between the server
            and client bundles. It only matters on the server: it has run before hydration. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="bg-surface-1 text-neutral-950 dark:text-neutral-50">
        {/* Site-wide FF corner style. */}
        <ShapeProvider defaultShape="pill">
          <SurfaceProvider value={1}>{children}</SurfaceProvider>
        </ShapeProvider>
        {import.meta.env.DEV_TOOLS && <ThemedDialKit />}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
