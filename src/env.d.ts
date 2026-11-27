interface ImportMetaEnv {
  /**
   * Build-time switch for the dev tools: the `?sleep` override, renderer profiling, and the /dev
   * playground. True in the dev server and on dev.imomadjid.com; production builds drop the code
   * it guards. Set by the `dev-tools` plugin in vite.config.ts.
   */
  readonly DEV_TOOLS: boolean
}

/** The Network Information API, Chromium only, which TypeScript's DOM types leave out. */
interface NetworkInformation {
  /** The visitor turned on their browser's or OS's data saver. */
  readonly saveData?: boolean
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
}

interface Navigator {
  readonly connection?: NetworkInformation
}
