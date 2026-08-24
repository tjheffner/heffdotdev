import { dev } from '$app/environment'
import { SITE_URL } from '$lib/siteConfig'

/** widths offered to the browser in a srcset */
const WIDTHS = [400, 800, 1600]

/**
 * Route a remote image through Cloudflare Image Transformations: resize, a
 * modern format, and an edge cache in front of github.com. Every image here
 * comes off a GitHub issue, and those attachment URLs take no size params of
 * their own, so proxying is the only option.
 *
 * /cdn-cgi/ only exists on the heffner.dev zone, not on a *.workers.dev preview
 * or under `vite dev`. Pointing at the apex keeps previews rendering real
 * images; dev returns the original URL untouched.
 *
 * Needs Transformations enabled on the zone and resizing allowed from any
 * origin, since the sources are github.com. Otherwise the CDN answers 403.
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
