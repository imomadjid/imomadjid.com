import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { DialRoot } from 'dialkit'
import type { ReactNode } from 'react'

import { SurfaceProvider } from '#/lib/surface-context'
import { THEME_SCRIPT, useTheme } from '#/lib/theme'

import appCss from '#/styles.css?url'
import dialkitCss from 'dialkit/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Imo Madjid' },
    ],
    links: [
      ...(import.meta.env.DEV ? [{ rel: 'stylesheet', href: dialkitCss }] : []),
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'preload',
        href: '/fonts/allo/Allo-Regular.woff2',
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
      <Link
        to="/"
        className="text-sm text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-50"
      >
        Back to the homepage
      </Link>
    </main>
  )
}

function ThemedDialKit() {
  return <DialRoot theme={useTheme()} defaultOpen={false} />
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="bg-surface-1 text-neutral-950 dark:text-neutral-50">
        <SurfaceProvider value={1}>{children}</SurfaceProvider>
        {import.meta.env.DEV && <ThemedDialKit />}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
