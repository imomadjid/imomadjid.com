import { DurableObject } from 'cloudflare:workers'
import type { DurableObjectState } from 'cloudflare:workers'

import { Ledger } from './postmark-ledger'
import type { Visit } from './postmark-ledger'

// The Worker's bindings, of which the ledger reads none.
type Bindings = Readonly<Record<string, never>>

/**
 * The postmark footer's ledger as one Durable Object for the whole site, over its own SQLite
 * storage: every stamp, visitor and place in one place, numbered in order, and who's online in
 * its memory. The Worker calls its methods over RPC (src/lib/postmark-api.ts). Only the dev
 * site binds it until the footer ships (wrangler.jsonc).
 */
export class PostmarkLedger extends DurableObject<Bindings> {
  readonly #ledger: Ledger | undefined

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env)
    // Production builds leave the ledger out until the footer ships there.
    this.#ledger = import.meta.env.DEV_TOOLS ? new Ledger(ctx.storage.sql) : undefined
  }

  #open() {
    if (!this.#ledger) throw new Error('The postmark ledger is off in this build')
    return this.#ledger
  }

  look(visit: Visit) {
    return this.#open().look(visit)
  }

  stamp(visit: Visit) {
    return this.#open().stamp(visit)
  }

  here(visitor: string | undefined) {
    this.#open().here(visitor)
  }

  stats() {
    return this.#open().stats()
  }
}
