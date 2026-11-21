import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
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
        href: '/fonts/sunghyun-sans/SunghyunSans-Regular.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
})

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
