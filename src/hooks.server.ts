import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  // Tag <body> with the route group so group-specific theming (global.css /
  // christmas.css) is gated to its own group and can't bleed across the
  // (main) <-> (nowrapper) boundary. The root layout keeps this in sync on
  // client-side navigation; this sets it for the initial SSR paint.
  const group = event.route.id?.includes('(nowrapper)') ? 'nowrapper' : 'main'
  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('<body', `<body data-group="${group}"`),
    preload: ({ type }) => {
      return type === 'font' || type === 'js' || type === 'css'
    },
  })
  return response
}
