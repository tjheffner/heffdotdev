import { dev } from '$app/environment'

/** widths offered to the browser in a srcset */
const WIDTHS = [400, 800, 1600]

/**
 * Route a remote image through Netlify's Image CDN: resize, a modern format
 * picked by content negotiation, and an edge cache in front of github.com.
 * Every image on this site comes off a GitHub issue, and those attachment URLs
 * accept no size params of their own — proxying is the only lever we have.
 *
 * The endpoint only exists on Netlify: `vite dev` has no /.netlify/images, so
 * in dev these hand back the original URL untouched. Use `netlify dev` to
 * exercise the real thing. Remote hosts must be allowlisted under [images] in
 * netlify.toml or the CDN answers 400.
 */
export function cdnImage(src: string | undefined, width = 800) {
  if (dev || !src?.startsWith('http')) return src
  return `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&q=70`
}

/** The same image at a few widths, for the browser to choose from. */
export function cdnSrcset(src: string | undefined) {
  if (dev || !src?.startsWith('http')) return undefined
  return WIDTHS.map((w) => `${cdnImage(src, w)} ${w}w`).join(', ')
}
