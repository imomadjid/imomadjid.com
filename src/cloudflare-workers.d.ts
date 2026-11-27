// The part of the Workers runtime's `cloudflare:workers` module the site uses: a Durable Object
// over its SQLite storage and alarm (src/lib/postmark-ledger-object.ts), and its key-value calls
// (src/lib/sleep-focus-object.ts). The full types
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
      // Runs the object's `alarm()` at `time` (ms since the epoch), replacing any alarm already set.
      setAlarm: (time: number) => Promise<void>
      get: <Value>(key: string) => Promise<Value | undefined>
      put: <Value>(key: string, value: Value) => Promise<void>
    }
  }

  export abstract class DurableObject<Env = unknown> {
    protected ctx: DurableObjectState
    protected env: Env
    constructor(ctx: DurableObjectState, env: Env)
  }
}
