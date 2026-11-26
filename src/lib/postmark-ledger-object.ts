import { DurableObject } from 'cloudflare:workers'
import type { DurableObjectState } from 'cloudflare:workers'

import { Ledger } from './postmark-ledger'
import type { Visit } from './postmark-ledger'

// The Worker's bindings, of which the ledger reads none.
type Bindings = Readonly<Record<string, never>>

/**
 * The postmark footer's ledger as one Durable Object for the whole site, over its own SQLite
 * storage: every stamp, visitor and place in one place, numbered in order, and who's online in
 * its memory. The Worker calls its methods over RPC (src/lib/postmark-api.ts); wrangler.jsonc
 * binds it as POSTMARKS, a separate one for each of the site and the dev site.
 */
export class PostmarkLedger extends DurableObject<Bindings> {
  readonly #ledger: Ledger

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env)
    this.#ledger = new Ledger(ctx.storage.sql)
  }

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
}
