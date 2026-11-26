import { useMemo, useSyncExternalStore } from 'react'

import { currentPile, subscribePile } from '#/lib/postmark-client'

import { PostmarkPile } from './postmark-pile'
import { visitorPlaces } from './postmark-visitor-places'
import { fakeArrivals, stampRecords } from './postmark-visits'
import type { StampRecord } from './postmark-visits'

// The homepage's postmark footer, a pile of visitors' postmarks at the foot of the page. Its
// stamps come from the ledger (src/lib/postmark-ledger.ts): every real visitor's, the newest on
// top, over a bottom layer of made-up ones that the real ones bury as they come, so the pile
// looks lived in from the first day. A visitor is stamped once they use the page, not when it
// merely loads (src/lib/postmark-client.ts).
//
// With the dev tools, `?postmarks=` shows that many made-up visitors instead, and `?you=` pins
// one of them as yours.

// Made-up stamps under the real ones.
const fill = 60

const noChanges = () => () => {}

/**
 * With the dev tools, `?postmarks=` and `?you=`: how many made-up visitors to show instead of the
 * ledger's, and which of them is yours. Production never reads the query.
 */
const usePreview = import.meta.env.DEV_TOOLS
  ? () => {
      const search = useSyncExternalStore(
        noChanges,
        () => location.search,
        () => '',
      )
      return useMemo(() => {
        const query = new URLSearchParams(search)
        if (!query.has('postmarks') && !query.has('you')) return undefined
        const asked = Number(query.get('postmarks'))
        const count = Number.isInteger(asked) && asked > 0 ? Math.min(asked, 5000) : fill
        const you = query.get('you')
        const yours = you !== null && Number.isInteger(Number(you)) ? Number(you) : -1
        return { count, you: yours >= 0 && yours < count ? yours : count - 1 }
      }, [search])
    }
  : () => undefined

/** A real stamp's place in the pile: over every made-up one. */
const lift = (record: StampRecord): StampRecord => ({ ...record, index: record.index + fill })

export function PostmarkFooter() {
  const preview = usePreview()
  const pile = useSyncExternalStore(
    preview ? noChanges : subscribePile,
    currentPile,
    () => undefined,
  )
  const count = preview?.count ?? fill
  const madeUp = useMemo(() => stampRecords(fakeArrivals(count, visitorPlaces)), [count])
  // The pile keys stamps by index, so the visitor's own may repeat one of the newest.
  const shown = useMemo(() => {
    if (preview) return { records: madeUp, you: preview.you }
    const you = pile?.you ? lift(pile.you) : undefined
    return {
      records: [...madeUp, ...(pile?.newest.map(lift) ?? []), ...(you ? [you] : [])],
      count: fill + (pile?.total ?? 0),
      visitors: pile?.total ?? 0,
      you: you?.index,
    }
  }, [preview, madeUp, pile])

  return <PostmarkPile {...shown} className="mt-48 -mb-16" />
}
