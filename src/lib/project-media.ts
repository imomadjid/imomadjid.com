import type { VideoSource } from '#/components/project-preview-media'

// Vite fingerprints each file into /assets/, so a re-recorded demo gets a new URL and the old one
// can be cached for good. Only the URLs are bundled; the files load when the preview shows them.
const files = import.meta.glob<string>('../assets/projects/*/*', {
  query: '?url',
  import: 'default',
  eager: true,
})

/** The URL of `src/assets/projects/<path>`. A missing file fails the build, not the page. */
export function projectFile(path: string) {
  const url = files[`../assets/projects/${path}`]
  if (url === undefined) throw new Error(`No project media at src/assets/projects/${path}`)
  return url
}

/** A project's recording for one theme: `<theme>.webm`, `<theme>.mp4`, and `<theme>.webp`. */
export function projectVideo(project: string, theme: 'light' | 'dark'): VideoSource {
  return {
    webm: projectFile(`${project}/${theme}.webm`),
    mp4: projectFile(`${project}/${theme}.mp4`),
    poster: projectFile(`${project}/${theme}.webp`),
  }
}
