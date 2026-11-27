import { DurableObject } from 'cloudflare:workers'

import { afterReport } from './sleep-focus'
import type { SleepRecord } from './sleep-focus'

/**
 * Sleep Focus's state, one Durable Object for the site, so a report and the reads after it agree
 * at once. The Worker calls its methods over RPC (src/lib/sleep-focus.ts); wrangler.jsonc binds
 * it as SLEEP, a separate one for each of the site and the dev site.
 */
export class SleepFocus extends DurableObject {
  // Called over RPC, which Fallow can't follow.
  // fallow-ignore-next-line unused-class-member
  read() {
    return this.ctx.storage.get<SleepRecord>('state')
  }

  // fallow-ignore-next-line unused-class-member
  async set(asleep: boolean, now: number) {
    const record = afterReport(await this.ctx.storage.get<SleepRecord>('state'), asleep, now)
    await this.ctx.storage.put('state', record)
    return record
  }
}
