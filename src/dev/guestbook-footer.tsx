import { useDialKit } from 'dialkit'
import { useMemo, useSyncExternalStore } from 'react'

import { SiteFooter } from '#/components/site-footer'

import { GuestbookPile } from './guestbook-pile'
import { wallPlaces } from './guestbook-places'
import { fakeArrivals, pileControls, stampRecords } from './guestbook-wall'

// The homepage's footer with the Guestbook's pile under it, with the dev tools only until the
// Guestbook has real visitors: made-up ones stand in, 60 of them, or as many as `?guestbook=`
// asks for. DialKit's Guestbook panel tunes the pile.

const subscribe = () => () => {}
const asked = () => {
  const value = Number(new URLSearchParams(window.location.search).get('guestbook'))
  return Number.isInteger(value) && value > 0 ? Math.min(value, 5000) : 60
}

export function GuestbookFooter() {
  const count = useSyncExternalStore(subscribe, asked, () => 60)
  const records = useMemo(() => stampRecords(fakeArrivals(count, wallPlaces)), [count])
  const settings = useDialKit('Guestbook', pileControls)
  return (
    <GuestbookPile records={records} settings={settings} className="mt-32 -mb-16">
      <SiteFooter className="mt-0 pb-16" />
    </GuestbookPile>
  )
}
