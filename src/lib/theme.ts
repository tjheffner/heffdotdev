/**
 * The two <body> attributes, derived from the route id.
 *
 * `data-group` gates whole stylesheets (global.css's type scale, christmas.css)
 * to a route group so they can't bleed across the (main)/(nowrapper) boundary.
 * `data-theme` picks the palette in the generated token sheet
 * (src/hyzer-tokens.css, authored in hyzer.config.ts).
 *
 * They can't be one attribute: resume and the playgrounds are both (nowrapper)
 * but want different palettes.
 *
 * hooks.server.ts stamps both for the server render and the root layout keeps
 * them in sync on client-side navigation. Both call these.
 */

export type Group = 'main' | 'nowrapper'
export type Theme = 'main' | 'resume' | 'playground'

export function groupFor(routeId: string | null | undefined): Group {
  return (routeId ?? '').includes('(nowrapper)') ? 'nowrapper' : 'main'
}

export function themeFor(routeId: string | null | undefined): Theme {
  const id = routeId ?? ''
  // Only the (nowrapper) playgrounds. /playground under (main) is the index
  // listing, an ordinary page that wants the site palette.
  if (id.includes('(nowrapper)/playground')) return 'playground'
  if (id.includes('(nowrapper)/resume')) return 'resume'
  // Christmas falls through to 'main': it ships its own stylesheet and uses no
  // hyzer components, so it needs no theme of its own.
  return 'main'
}
