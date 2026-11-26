// The part of the Workers runtime's `cloudflare:workers` module the site uses: a Durable Object
// over its SQLite storage (src/lib/postmark-ledger-object.ts). The full types
// (@cloudflare/workers-types) redeclare the DOM's fetch types, so they stay out.
declare module 'cloudflare:workers' {
  export type DurableObjectState = {
    storage: {
      sql: {
        exec: (
          query: string,
          ...bindings: (string | number | null)[]
        ) => { toArray: () => Record<string, string | number | null>[] }
      }
    }
  }

  export abstract class DurableObject<Env = unknown> {
    protected ctx: DurableObjectState
    protected env: Env
    constructor(ctx: DurableObjectState, env: Env)
  }
}
