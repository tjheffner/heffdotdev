import type { Handle } from '@sveltejs/kit'
import { groupFor, themeFor } from '$lib/theme'

export const handle: Handle = async ({ event, resolve }) => {
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
  return response
}
