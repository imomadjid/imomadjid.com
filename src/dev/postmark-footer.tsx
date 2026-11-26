import { useMemo, useSyncExternalStore } from 'react'

import { currentPile, subscribePile } from './postmark-ledger-client'
import { PostmarkPile } from './postmark-pile'
import { visitorPlaces } from './postmark-visitor-places'
import { fakeArrivals, stampRecords } from './postmark-visits'
import type { StampRecord } from './postmark-visits'

// The homepage's postmark footer, a pile of visitors' postmarks at the foot of the page, with the
// dev tools only until it ships. Its stamps come from the ledger (src/lib/postmark-ledger.ts):
// every real visitor's, the newest on top, over a bottom layer of made-up ones that the real
// ones bury as they come, so the pile looks lived in from the first day. A visitor is stamped
// once they use the page, not when it merely loads (postmark-ledger-client.ts).
//
// `?postmarks=` shows that many made-up visitors instead, and `?you=` pins one of them as yours.

// Made-up stamps under the real ones.
const fill = 60

const subscribe = () => () => {}
const search = () => new URLSearchParams(window.location.search)
const asked = () => {
  const value = Number(search().get('postmarks'))
  return Number.isInteger(value) && value > 0 ? Math.min(value, 5000) : fill
}
const askedYou = () => {
  const value = search().get('you')
  return value !== null && Number.isInteger(Number(value)) ? Number(value) : -1
}
const previewing = () => search().has('postmarks') || search().has('you')

/** A real stamp's place in the pile: over every made-up one. */
const lift = (record: StampRecord): StampRecord => ({ ...record, index: record.index + fill })

export function PostmarkFooter() {
  const preview = useSyncExternalStore(subscribe, previewing, () => false)
  const count = useSyncExternalStore(subscribe, asked, () => fill)
  const askedFor = useSyncExternalStore(subscribe, askedYou, () => -1)
  const pile = useSyncExternalStore(
    preview ? subscribe : subscribePile,
    currentPile,
    () => undefined,
  )
  const madeUp = useMemo(
    () => stampRecords(fakeArrivals(preview ? count : fill, visitorPlaces)),
    [preview, count],
  )

  if (preview)
    return (
      <PostmarkPile
        records={madeUp}
        you={askedFor >= 0 && askedFor < count ? askedFor : count - 1}
        className="mt-32 -mb-16"
      />
    )

  const real = pile?.newest.map(lift) ?? []
  const you = pile?.you ? lift(pile.you) : undefined
  const records = [
    ...madeUp,
    ...real,
    ...(you && !real.some((record) => record.index === you.index) ? [you] : []),
  ]
  return (
    <PostmarkPile
      records={records}
      count={fill + (pile?.total ?? 0)}
      visitors={pile?.total ?? 0}
      you={you?.index}
      className="mt-32 -mb-16"
    />
  )
}
