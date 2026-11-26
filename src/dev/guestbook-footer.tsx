import { useMemo, useSyncExternalStore } from 'react'

import { SiteFooter } from '#/components/site-footer'

import { GuestbookPile } from './guestbook-pile'
import { wallPlaces } from './guestbook-places'
import { fakeArrivals, stampRecords } from './guestbook-wall'

// The homepage's footer with the Guestbook's pile under it, with the dev tools only until the
// Guestbook has real visitors: made-up ones stand in, 60 of them, or as many as `?guestbook=`
// asks for. The visitor's own stamp is the newest, or the one `?you=` names by its place in the
// Guestbook, as a visitor coming back finds theirs.

const subscribe = () => () => {}
const asked = () => {
  const value = Number(new URLSearchParams(window.location.search).get('guestbook'))
  return Number.isInteger(value) && value > 0 ? Math.min(value, 5000) : 60
}
const askedYou = () => {
  const value = new URLSearchParams(window.location.search).get('you')
  return value !== null && Number.isInteger(Number(value)) ? Number(value) : -1
}

export function GuestbookFooter() {
  const count = useSyncExternalStore(subscribe, asked, () => 60)
  const records = useMemo(() => stampRecords(fakeArrivals(count, wallPlaces)), [count])
  const you = useSyncExternalStore(subscribe, askedYou, () => -1)
  return (
    <GuestbookPile
      records={records}
      you={you >= 0 && you < count ? you : count - 1}
      className="mt-32 -mb-16"
    >
      <SiteFooter className="mt-0 pb-16" />
    </GuestbookPile>
  )
}
