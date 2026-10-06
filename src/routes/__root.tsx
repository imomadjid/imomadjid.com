import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { DialRoot } from 'dialkit'
import { MotionConfig } from 'motion/react'
import { useSyncExternalStore } from 'react'

import { SurfaceProvider } from '../lib/surface-context'
import {
  THEME_SCRIPT,
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeTheme,
} from '../lib/theme'

import appCss from '../styles.css?url'
import dialkitCss from 'dialkit/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      ...(import.meta.env.DEV ? [{ rel: 'stylesheet', href: dialkitCss }] : []),
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function ThemedDialKit() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
  return <DialRoot theme={theme} defaultOpen={false} />
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="bg-surface-1 text-neutral-950 dark:text-neutral-50">
        <MotionConfig reducedMotion="user">
          <SurfaceProvider value={1}>{children}</SurfaceProvider>
        </MotionConfig>
        {import.meta.env.DEV && <ThemedDialKit />}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
