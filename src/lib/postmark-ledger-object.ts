import { DurableObject } from 'cloudflare:workers'

import { Ledger } from './postmark-ledger'
import type { Visit } from './postmark-ledger'

/**
 * The postmark footer's ledger as one Durable Object for the whole site, over its own SQLite
 * storage: every stamp, visitor and place in one place, numbered in order, and who's online in
 * its memory. The Worker calls its methods over RPC (src/lib/postmark-api.ts); wrangler.jsonc
 * binds it as POSTMARKS, a separate one for each of the site and the dev site.
 */
export class PostmarkLedger extends DurableObject {
  // Fields start after the base constructor has set `ctx`. New places' map outlines are drawn in
  // an alarm, after their visitors have their answer; the runtime retries an alarm that fails.
  readonly #ledger = new Ledger(this.ctx.storage.sql, {
    queued: () => void this.ctx.storage.setAlarm(Date.now()),
  })

  // Called over RPC, which Fallow can't follow.
  // fallow-ignore-next-line unused-class-member
  look(visit: Visit) {
    return this.#ledger.look(visit)
  }

  // fallow-ignore-next-line unused-class-member
  stamp(visit: Visit) {
    return this.#ledger.stamp(visit)
  }

  // fallow-ignore-next-line unused-class-member
  here(visitor: string | undefined) {
    this.#ledger.here(visitor)
  }

  // fallow-ignore-next-line unused-class-member
  stats() {
    return this.#ledger.stats()
  }

  // The runtime calls it when the alarm the ledger set goes off.
  alarm() {
    return this.#ledger.drawOutlines()
  }
}
