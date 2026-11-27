// Social apps open links in their own in-app browser, a web view with no address bar, no
// extensions and no saved sign-ins. This finds the app from its user agent and says how to reopen
// the page in the visitor's own browser. No app documents a way out (LINE aside), so the escapes
// are field-tested ones, checked against reports from late 2026: shalanah/inapp-debugger's matrix
// and plugwith.me's device tests.
//
// - Android: an `intent://` URL hands the page to the default browser. The app parses it, not
//   Chrome, so only apps known to handle it get it, and on load; in others it replaces the page
//   with an error. It names no package, so Android opens the visitor's default browser.
// - iOS: no app lets a page leave on its own. Instagram and Threads open their own
//   "open in browser" links on a tap (Instagram asks first). Meta's apps drop `x-safari-https`
//   since mid-2025, but LinkedIn, WhatsApp and Telegram still take it.
// - Facebook, TikTok, X, WeChat and Snapchat have no link that works, so the visitor is shown
//   where the app's own menu is.
//
// Only an app's own token counts: a bare iOS web view or Android `wv` marker is also every home
// screen web app and many apps that need nothing, and real browsers (Chrome's CriOS, Firefox's
// FxiOS, Edge, Samsung Internet, Brave) carry no app token.

export type Platform = 'ios' | 'android'

/** How to leave: follow `url` on load, offer it as a link to tap, or show the app's menu. */
export type Escape =
  | { kind: 'redirect'; url: string }
  | { kind: 'tap'; url: string }
  | { kind: 'menu' }

export interface InAppBrowser {
  app: string
  platform: Platform
}

type EscapeFor = (url: string) => Escape

const menu: EscapeFor = () => ({ kind: 'menu' })
const intent: EscapeFor = (url) => ({ kind: 'redirect', url: intentUrl(url) })
const tap =
  (to: (url: string) => string): EscapeFor =>
  (url) => ({ kind: 'tap', url: to(url) })
const safari = tap((url) => url.replace(/^https?:\/\//, (scheme) => `x-safari-${scheme}`))
const appLink = (scheme: string) => tap((url) => `${scheme}?url=${encodeURIComponent(url)}`)

// In order: Threads' user agent can also name Instagram, and Instagram's Meta's in-app markers.
const apps: readonly {
  app: string
  test: RegExp
  ios: EscapeFor
  android: EscapeFor
}[] = [
  {
    app: 'Threads',
    test: /\bBarcelona\b/,
    ios: appLink('barcelona://extbrowser/'),
    android: intent,
  },
  {
    app: 'Instagram',
    test: /\bInstagram\b/,
    ios: appLink('instagram://extbrowser/'),
    android: intent,
  },
  {
    app: 'Facebook',
    // Facebook and Messenger: [FBAN/FBIOS;FBAV/…], [FB_IAB/FB4A;FBAV/…], [FB_IAB/Orca-Android;…].
    test: /\bFB(?:AN|AV|_IAB)\/|\bIABMV\//,
    ios: menu,
    android: intent,
  },
  { app: 'TikTok', test: /\bmusical_ly|\bBytedance|\btrill_/, ios: menu, android: menu },
  { app: 'X', test: /\bTwitter(?:Android)?\b/, ios: menu, android: menu },
  { app: 'LinkedIn', test: /\bLinkedInApp\b/, ios: safari, android: menu },
  { app: 'WhatsApp', test: /\bWhatsApp\b|\bWAiOS\/|\bWA4A\//, ios: safari, android: menu },
  { app: 'Telegram', test: /\bTelegram(?:-iOS)?\//, ios: safari, android: intent },
  {
    app: 'LINE',
    test: /\bLine\/\d/,
    ios: (url) => ({ kind: 'redirect', url: withParam(url, 'openExternalBrowser', '1') }),
    android: (url) => ({ kind: 'redirect', url: withParam(url, 'openExternalBrowser', '1') }),
  },
  {
    app: 'KakaoTalk',
    test: /\bKAKAOTALK\b/i,
    ios: appLink('kakaotalk://web/openExternal'),
    android: appLink('kakaotalk://web/openExternal'),
  },
  { app: 'WeChat', test: /\bMicroMessenger\//, ios: menu, android: menu },
  { app: 'Snapchat', test: /\bSnapchat\b/, ios: menu, android: menu },
]

/**
 * The page's address carries this once it has been sent on to a browser, so a browser (or an
 * app that opens the fallback in its own view) doesn't send it on again; the page strips it.
 */
export const escapedParam = 'escaped'

function withParam(url: string, key: string, value: string) {
  const next = new URL(url)
  next.searchParams.set(key, value)
  return next.toString()
}

/** The address with the escape marker, for the browser it opens in to see. */
export function markEscaped(url: string) {
  return withParam(url, escapedParam, '1')
}

/**
 * Android's hand-off of an http(s) address to the default browser. Its own fragment is the
 * intent's, so the address goes without its hash; the fallback keeps it.
 */
export function intentUrl(url: string) {
  const { protocol, host, pathname, search } = new URL(url)
  const scheme = protocol.slice(0, -1)
  return `intent://${host}${pathname}${search}#Intent;scheme=${scheme};S.browser_fallback_url=${encodeURIComponent(url)};end`
}

export interface Device {
  userAgent: string
  // iPadOS asks for desktop sites with a Mac's user agent; only its touch screen tells them apart.
  maxTouchPoints?: number
  // A home screen web app is a web view too, but the visitor chose it.
  standalone?: boolean
  // Telegram on Android leaves no mark in its user agent, only these globals.
  telegramGlobals?: boolean
}

function platformOf({ userAgent, maxTouchPoints = 0 }: Device): Platform | undefined {
  if (/\bAndroid\b/.test(userAgent)) return 'android'
  if (/\biP(?:hone|ad|od)\b/.test(userAgent)) return 'ios'
  if (/\bMacintosh\b/.test(userAgent) && maxTouchPoints > 1) return 'ios'
  return undefined
}

/** The app whose in-app browser this is, or undefined in a browser of the visitor's own. */
export function inAppBrowser(device: Device): InAppBrowser | undefined {
  if (device.standalone) return undefined
  const platform = platformOf(device)
  if (!platform) return undefined
  const found = apps.find(({ test }) => test.test(device.userAgent))
  if (found) return { app: found.app, platform }
  if (device.telegramGlobals && platform === 'android') return { app: 'Telegram', platform }
  return undefined
}

/** How to reopen `url` in the visitor's own browser from `browser`. */
export function escapeFrom(browser: InAppBrowser, url: string): Escape {
  const found = apps.find(({ app }) => app === browser.app)
  if (!found) return { kind: 'menu' }
  return found[browser.platform](markEscaped(url))
}
