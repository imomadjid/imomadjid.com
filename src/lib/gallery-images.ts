// Decoded photos, shared by the Gallery's renderers, so hovering a tile can warm up the photo its
// full-screen view needs.

const decoded = new Map<string, Promise<HTMLImageElement>>()
const ready = new Map<string, HTMLImageElement>()

/** The photo at `url`, decoded; loads once per page. */
export function decodedImage(url: string): Promise<HTMLImageElement> {
  let image = decoded.get(url)
  if (!image) {
    const element = new Image()
    element.src = url
    image = element.decode().then(() => {
      ready.set(url, element)
      return element
    })
    // A failed load can be tried again.
    image.catch(() => decoded.delete(url))
    decoded.set(url, image)
  }
  return image
}

/** The photo at `url` if `decodedImage` has finished decoding it, without waiting. */
export function decodedNow(url: string): HTMLImageElement | undefined {
  return ready.get(url)
}
