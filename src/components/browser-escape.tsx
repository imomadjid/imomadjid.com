import { IconArrowUpRight, IconCheck, IconLink, IconX } from '@tabler/icons-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { IconButton } from '#/components/ui/icon-button'
import { escapeFrom, escapedParam, inAppBrowser } from '#/lib/in-app-browser'
import type { Escape, Platform } from '#/lib/in-app-browser'
import { normalizeSurfaceLevel, surfaceClasses } from '#/lib/surface-classes'
import { SurfaceProvider, useSurface } from '#/lib/surface-context'
import { tw } from '#/lib/tw'
import { cn } from '#/lib/utils'
import { webGpuRuns } from '#/lib/webgpu-probe'

// Offers a visitor in a social app's in-app browser the way back to their own browser
// (#/lib/in-app-browser). Where the app hands the page on by itself (Android's intent, LINE),
// the page goes on load, once a session; where it takes a tap (Instagram and Threads on iPhone),
// or has no way out but its own menu, a small bar at the foot says so. The bar stays after a
// redirect too, in case the app ignored it. Its open and copy buttons carry `data-escape-open`,
// which the postmark ledger's client doesn't count as an action, so a visitor leaving for their
// browser is stamped there rather than twice.
//
// It all waits on WebGPU (#/lib/webgpu-probe): where the web view runs it (Instagram's from
// Stories does), the Gallery's flights and warps play as in a browser and nothing is worth leaving
// for, so the page stays and says nothing. Only a web view without it (Instagram's from a DM) is
// redirected or shown the bar.

const redirectedKey = 'browser-escape:redirected'
const dismissedKey = 'browser-escape:dismissed'

interface Here {
  platform: Platform
  escape: Escape
  // The page came from an escape already: an app that opened the fallback in its own view.
  escaped: boolean
}

// Session storage throws in some web views and private windows (and is missing on the server); without it the bar shows again
// on the next load, and the redirect is still guarded by the address's marker.
function remembered(key: string) {
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function remember(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    // It lasts until the next load.
  }
}

// Set once the page is known to be in an in-app browser without WebGPU, and never changes after.
let here: Here | undefined
let asked: Promise<void> | undefined

async function ask() {
  const nav: Navigator & { standalone?: boolean } = navigator
  const browser = inAppBrowser({
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints,
    standalone: nav.standalone === true || matchMedia('(display-mode: standalone)').matches,
    telegramGlobals: 'TelegramWebview' in window || 'TelegramWebviewProxy' in window,
  })
  // Only an in-app browser is probed, and only one the visitor hasn't already dismissed the bar in.
  if (!browser || remembered(dismissedKey) || (await webGpuRuns(nav.gpu))) return
  const page = new URL(location.href)
  const escaped = page.searchParams.has(escapedParam)
  page.searchParams.delete(escapedParam)
  here = { platform: browser.platform, escape: escapeFrom(browser, page.toString()), escaped }
}

function subscribe(onChange: () => void) {
  let live = true
  asked ??= ask()
  void asked.then(() => {
    if (live) onChange()
  })
  return () => {
    live = false
  }
}

const readHere = () => here
const onServer = () => undefined

/** Takes the escape marker off the address, in whatever browser the page opened in. */
function unmark() {
  const url = new URL(location.href)
  if (!url.searchParams.has(escapedParam)) return
  url.searchParams.delete(escapedParam)
  history.replaceState(history.state, '', url)
}

// A solid pill in the page's ink, as a primary button is; FF's Button isn't in the site's sheet.
const actionClass = tw(
  'inline-flex h-8 shrink-0 items-center rounded-full bg-neutral-950 px-3.5 text-caption font-medium whitespace-nowrap text-neutral-50 transition-[scale,background-color] duration-180 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 active:scale-96 motion-reduce:transition-none dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200',
)

export function BrowserEscape() {
  const parentLevel = useSurface()
  const found = useSyncExternalStore(subscribe, readHere, onServer)
  // Dismissed in an earlier load, the store never finds anything; this is for this one.
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(unmark, [])

  useEffect(() => {
    if (found?.escape.kind !== 'redirect' || found.escaped || remembered(redirectedKey)) return
    remember(redirectedKey)
    location.href = found.escape.url
  }, [found])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
    } catch {
      // Some web views refuse the clipboard; the menu steps still stand.
    }
  }

  if (!found || dismissed) return null
  const { escape, platform } = found
  const menu = platform === 'ios' ? '•••' : '⋮'

  // A popover's elevation over the page it floats above.
  const level = normalizeSurfaceLevel(parentLevel + 2)

  return (
    <section
      aria-label="Open in your browser"
      className={cn(
        'fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-sm animate-enter items-center gap-2 rounded-full py-2 pr-2 pl-5 text-neutral-800 [--enter-step:0ms] [animation-delay:800ms] dark:text-neutral-200',
        surfaceClasses(level),
      )}
    >
      <SurfaceProvider value={level}>
        <p className="min-w-0 flex-1 text-caption">
          {escape.kind === 'menu' ? (
            <>
              Tap {menu} to open in <span className="max-[359px]:hidden">your </span>browser
            </>
          ) : (
            'Best seen in your browser'
          )}
        </p>
        {escape.kind === 'menu' ? (
          <button
            type="button"
            data-escape-open
            aria-label={copied ? 'Link copied' : 'Copy link'}
            className={`${actionClass} gap-1 pl-3 max-[359px]:px-2`}
            onClick={() => void copyLink()}
          >
            {copied ? (
              <IconCheck aria-hidden="true" size={16} strokeWidth={2} />
            ) : (
              <IconLink aria-hidden="true" size={16} strokeWidth={2} />
            )}
            {/* On the narrowest phones the icon alone keeps the line on one row. */}
            <span aria-hidden="true" className="max-[359px]:hidden">
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>
        ) : (
          <a href={escape.url} data-escape-open className={`${actionClass} gap-1 pr-3`}>
            Open
            <IconArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
          </a>
        )}
        <IconButton
          aria-label="Dismiss"
          data-cuelume-close
          onClick={() => {
            remember(dismissedKey)
            setDismissed(true)
          }}
        >
          <IconX size={18} strokeWidth={2} />
        </IconButton>
      </SurfaceProvider>
    </section>
  )
}
