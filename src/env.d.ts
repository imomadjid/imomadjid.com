interface ImportMetaEnv {
  /**
   * Build-time switch for the dev tools: DialKit, Sleep Focus, renderer profiling, and the /dev
   * playground. True in the dev server and on dev.imomadjid.com; production builds drop the code
   * it guards. Set by the `dev-tools` plugin in vite.config.ts.
   */
  readonly DEV_TOOLS: boolean
}
