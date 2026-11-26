import { useMemo, useSyncExternalStore } from 'react'

import { PostmarkPile } from './postmark-pile'
import { visitorPlaces } from './postmark-visitor-places'
import { fakeArrivals, stampRecords } from './postmark-visits'

// The homepage's postmark footer, a pile of visitors' postmarks at the foot of the page, with the
// dev tools only until it has real visitors: made-up ones stand in, 60 of them, or as many as
// `?postmarks=` asks for. The visitor's own stamp is the newest, or the one `?you=` names by its
// place among the visitors, as a visitor coming back finds theirs.

const subscribe = () => () => {}
const asked = () => {
  const value = Number(new URLSearchParams(window.location.search).get('postmarks'))
  return Number.isInteger(value) && value > 0 ? Math.min(value, 5000) : 60
}
const askedYou = () => {
  const value = new URLSearchParams(window.location.search).get('you')
  return value !== null && Number.isInteger(Number(value)) ? Number(value) : -1
}

export function PostmarkFooter() {
  const count = useSyncExternalStore(subscribe, asked, () => 60)
  const records = useMemo(() => stampRecords(fakeArrivals(count, visitorPlaces)), [count])
  const you = useSyncExternalStore(subscribe, askedYou, () => -1)
  return (
    <PostmarkPile
      records={records}
      you={you >= 0 && you < count ? you : count - 1}
      className="mt-32 -mb-16"
    />
  )
}
