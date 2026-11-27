import assert from 'node:assert/strict'
import { test } from 'node:test'

import { escapeFrom, inAppBrowser, intentUrl, markEscaped } from './in-app-browser'

const iphone = (tail: string) =>
  `Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ${tail}`
const android = (tail: string) =>
  `Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.39 Mobile Safari/537.36 ${tail}`

const apps: [string, string, string][] = [
  [
    'Instagram',
    'ios',
    iphone(
      'Mobile/15E148 Instagram 380.0.0.29.109 (iPhone15,3; iOS 18_5; en_US; en; scale=3.00; 1290x2796; 735574347) NW/3',
    ),
  ],
  [
    'Instagram',
    'android',
    android(
      'Instagram 330.0.0.40.92 Android (34/14; 480dpi; 1080x2340; samsung; SM-S918B; dm3q; qcom; en_US; 594171624)',
    ),
  ],
  [
    'Threads',
    'ios',
    iphone(
      'Mobile/15E148 Barcelona 325.0.0.27.75 (iPhone14,5; iOS 18_5; en_US; en; scale=3.00; 1170x2532) Instagram 325.0.0.27.75',
    ),
  ],
  [
    'Facebook',
    'ios',
    iphone(
      'Mobile/15E148 [FBAN/FBIOS;FBAV/455.0.0.39.105;FBBV/601573467;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
    ),
  ],
  ['Facebook', 'android', android('[FB_IAB/FB4A;FBAV/455.0.0.44.88;]')],
  ['Facebook', 'android', android('[FB_IAB/Orca-Android;FBAV/455.0.0.18.110;]')],
  [
    'TikTok',
    'ios',
    iphone('Mobile/15E148 musical_ly_33.8.0 JsSdk/2.0 NetType/WIFI Channel/App Store'),
  ],
  ['TikTok', 'android', android('trill_330304 BytedanceWebview/d8a21c6')],
  ['X', 'ios', iphone('Mobile/15E148 Twitter for iPhone/10.34')],
  ['LinkedIn', 'ios', iphone('Mobile/15E148 [LinkedInApp]/9.29.8964')],
  ['WhatsApp', 'ios', iphone('Mobile/15E148 WhatsApp/2.24.25.81')],
  ['LINE', 'ios', iphone('Mobile/15E148 Safari Line/14.5.0')],
  ['KakaoTalk', 'android', android('KAKAOTALK 10.5.5')],
  ['WeChat', 'ios', iphone('Mobile/15E148 MicroMessenger/8.0.47(0x18002f2c) NetType/WIFI')],
]

void test('each app is found by its own token, on its platform', () => {
  for (const [app, platform, userAgent] of apps)
    assert.deepEqual(inAppBrowser({ userAgent }), { app, platform }, userAgent)
})

void test("a browser of the visitor's own is not an in-app browser", () => {
  const browsers = [
    iphone('Version/18.5 Mobile/15E148 Safari/604.1'),
    iphone('CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1'),
    iphone('FxiOS/133.0 Mobile/15E148 Safari/605.1.15'),
    iphone('EdgiOS/131.0.2903.68 Version/18.0 Mobile/15E148 Safari/604.1'),
    // The Google app: the visitor chose it.
    iphone('GSA/300.0.598994041 Mobile/15E148 Safari/604.1'),
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.39 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
    // Some other app's web view, which may need nothing.
    android(''),
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  ]
  for (const userAgent of browsers) assert.equal(inAppBrowser({ userAgent }), undefined, userAgent)
})

void test('an iPad asking for desktop sites is still iOS, and a home screen app is left alone', () => {
  const desktop =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 380.0.0.29.109'
  assert.deepEqual(inAppBrowser({ userAgent: desktop, maxTouchPoints: 5 }), {
    app: 'Instagram',
    platform: 'ios',
  })
  assert.equal(inAppBrowser({ userAgent: desktop, maxTouchPoints: 0 }), undefined, 'a Mac')
  const instagram = apps[0]?.[2]
  assert.ok(instagram)
  assert.equal(inAppBrowser({ userAgent: instagram, standalone: true }), undefined)
})

void test('Telegram on Android is found by its globals, as it leaves no mark in the user agent', () => {
  assert.deepEqual(inAppBrowser({ userAgent: android(''), telegramGlobals: true }), {
    app: 'Telegram',
    platform: 'android',
  })
})

void test('each app gets the escape that works there', () => {
  const page = 'https://imomadjid.com/?postmarks=3#projects'
  const marked = 'https://imomadjid.com/?postmarks=3&escaped=1#projects'
  assert.equal(markEscaped(page), marked)

  assert.deepEqual(escapeFrom({ app: 'Instagram', platform: 'ios' }, page), {
    kind: 'tap',
    url: `instagram://extbrowser/?url=${encodeURIComponent(marked)}`,
  })
  assert.deepEqual(escapeFrom({ app: 'Threads', platform: 'ios' }, page), {
    kind: 'tap',
    url: `barcelona://extbrowser/?url=${encodeURIComponent(marked)}`,
  })
  assert.deepEqual(escapeFrom({ app: 'Instagram', platform: 'android' }, page), {
    kind: 'redirect',
    url: intentUrl(marked),
  })
  assert.deepEqual(escapeFrom({ app: 'LinkedIn', platform: 'ios' }, page), {
    kind: 'tap',
    url: 'x-safari-https://imomadjid.com/?postmarks=3&escaped=1#projects',
  })
  assert.deepEqual(escapeFrom({ app: 'LINE', platform: 'ios' }, page), {
    kind: 'redirect',
    url: 'https://imomadjid.com/?postmarks=3&escaped=1&openExternalBrowser=1#projects',
  })
  for (const app of ['Facebook', 'TikTok', 'X', 'WeChat'])
    assert.deepEqual(escapeFrom({ app, platform: 'ios' }, page), { kind: 'menu' }, app)
})

void test("Android's intent opens the default browser, falling back to the page itself", () => {
  assert.equal(
    intentUrl('https://imomadjid.com/a?b=1#c'),
    'intent://imomadjid.com/a?b=1#Intent;scheme=https;S.browser_fallback_url=https%3A%2F%2Fimomadjid.com%2Fa%3Fb%3D1%23c;end',
  )
})
