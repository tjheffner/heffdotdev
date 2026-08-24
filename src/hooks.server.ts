import { redirect, type Handle } from '@sveltejs/kit'
import { groupFor, themeFor } from '$lib/theme'

// Cloudflare's _redirects and _headers files only cover responses the static
// asset server produces — anything the worker renders (every page, every
// endpoint) is untouched by them. So both live here instead.
const REDIRECTS: Record<string, string> = {
  '/feed': '/rss.xml',
  '/rss': '/rss.xml',
  '/api/rss.xml': '/rss.xml',
  '/about/latest': '/about',
}

export const handle: Handle = async ({ event, resolve }) => {
  const to = REDIRECTS[event.url.pathname]
  if (to) redirect(301, to)

  // Tag <body> with the route group (the CSS barrier) and the palette theme.
  // See src/lib/theme.ts for why those are two attributes and not one. The
  // root layout keeps both in sync on client-side navigation; this sets them
  // for the initial SSR paint, so the first frame is already themed.
  const group = groupFor(event.route.id)
  const theme = themeFor(event.route.id)
  const response = await resolve(event, {
    // Target the valueless placeholder attributes from app.html, not a bare
    // "<body". String.replace takes the FIRST match in the document, and any
    // inlined stylesheet in <head> that happens to contain the text "<body"
    // precedes the real tag — which silently stamps a CSS comment and leaves
    // the actual body unthemed.
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
  // Every HTML response gets a short shared-cache TTL, whatever the route asked
  // for. adapter-cloudflare's worker stores cacheable responses in
  // caches.default and a release doesn't purge it, unlike Netlify's atomic
  // deploys. A page held under the route's own max-age=86400 keeps serving
  // _app/immutable hashes the new deploy no longer has, so it renders and then
  // fails to hydrate — which is exactly what happened after the first
  // production deploy. Setting this only when the header was absent wasn't
  // enough: the content pages call setHeaders themselves.
  //
  // Browsers still honour the longer max-age; this bounds the shared copy only.
  // Non-HTML responses keep their own policy (the OG image's year-long
  // s-maxage), since nothing but HTML embeds a build's asset hashes.
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.startsWith('text/html')) {
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
  } else if (!response.headers.has('cache-control')) {
    response.headers.set('Cache-Control', 'public, max-age=4000, s-maxage=60')
  }

  return response
}
