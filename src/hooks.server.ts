import { redirect, type Handle } from '@sveltejs/kit'
import { groupFor, themeFor } from '$lib/theme'
import { SITE_URL } from '$lib/siteConfig'

// Cloudflare's _redirects and _headers files only apply to static assets, not
// to anything the worker renders. Every page and endpoint goes through here.
const REDIRECTS: Record<string, string> = {
  '/feed': '/rss.xml',
  '/rss': '/rss.xml',
  '/api/rss.xml': '/rss.xml',
  '/about/latest': '/about',
}

export const handle: Handle = async ({ event, resolve }) => {
  const to = REDIRECTS[event.url.pathname]
  if (to) redirect(301, to)

  // Tag <body> with the route group and the palette theme, so the first
  // server-rendered frame is already themed. The root layout keeps them in sync
  // after that. See src/lib/theme.ts for why it's two attributes, not one.
  const group = groupFor(event.route.id)
  const theme = themeFor(event.route.id)
  const response = await resolve(event, {
    // Match the placeholder attributes from app.html, not a bare "<body".
    // String.replace only replaces the first match, and an inlined stylesheet
    // containing the text "<body" comes first, which would leave the real body
    // unthemed.
    transformPageChunk: ({ html }) =>
      html.replace(
        '<body data-group data-theme>',
        `<body data-group="${group}" data-theme="${theme}">`
      ),
    preload: ({ type }) => {
      return type === 'font' || type === 'js' || type === 'css'
    },
  })

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Cap the shared-cache TTL on every HTML response, overriding whatever the
  // route asked for. adapter-cloudflare stores responses in caches.default and
  // deploys don't purge it, so cached HTML can outlive the build it came from
  // and reference _app/immutable hashes that no longer exist. The page renders
  // and then fails to hydrate. Only HTML needs this; nothing else embeds asset
  // hashes. Browsers still honour the longer max-age.
  //
  // Previews skip the cache entirely: they redeploy on every push, so stale
  // HTML is the norm rather than the exception. It has to be no-store, not
  // s-maxage=0. The adapter decides what to cache by matching Cache-Control
  // against /private|no-cache|no-store/ and never looks at s-maxage.
  const isPreview = event.url.hostname !== new URL(SITE_URL).hostname
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.startsWith('text/html')) {
    if (isPreview) {
      response.headers.set('Cache-Control', 'no-store')
    } else {
      const directives = (
        response.headers.get('cache-control') ?? 'public, max-age=4000'
      )
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d && !d.startsWith('s-maxage='))
      response.headers.set(
        'Cache-Control',
        [...directives, 's-maxage=60'].join(', ')
      )
    }
  } else if (!response.headers.has('cache-control')) {
    response.headers.set('Cache-Control', 'public, max-age=4000, s-maxage=60')
  }

  return response
}
