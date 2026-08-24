import { dev } from '$app/environment'
import { SITE_URL } from '$lib/siteConfig'

/** widths offered to the browser in a srcset */
const WIDTHS = [400, 800, 1600]

/**
 * Route a remote image through Cloudflare Image Transformations: resize, a
 * modern format picked by content negotiation, and an edge cache in front of
 * github.com. Every image on this site comes off a GitHub issue, and those
 * attachment URLs accept no size params of their own — proxying is the only
 * lever we have.
 *
 * /cdn-cgi/ is a zone feature, so it exists on heffner.dev but not on a
 * *.workers.dev preview or under `vite dev`. Absolute URLs against the apex
 * keep previews rendering real images instead of 404s; dev hands back the
 * original URL untouched.
 *
 * Requires Transformations enabled on the zone, with resizing allowed from any
 * origin (the sources are github.com, not us) — otherwise the CDN answers 403.
 */
export function cdnImage(src: string | undefined, width = 800) {
  if (dev || !src?.startsWith('http')) return src
  return `${SITE_URL}/cdn-cgi/image/width=${width},quality=70,format=auto/${src}`
}

/** The same image at a few widths, for the browser to choose from. */
export function cdnSrcset(src: string | undefined) {
  if (dev || !src?.startsWith('http')) return undefined
  return WIDTHS.map((w) => `${cdnImage(src, w)} ${w}w`).join(', ')
}
