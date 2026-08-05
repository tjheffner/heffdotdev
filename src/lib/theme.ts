/**
 * The two <body> attributes, derived from one route id in one place.
 *
 * They do different jobs and must not be conflated:
 *
 * - `data-group` is the app-level CSS barrier. It gates whole stylesheets
 *   (global.css's type scale, christmas.css's body rules) to a route group so
 *   they cannot bleed across the (main) <-> (nowrapper) boundary.
 * - `data-theme` is the palette axis, consumed by the generated token sheet
 *   (src/hyzer-tokens.css, authored in hyzer.config.ts).
 *
 * A group holds several themes — resume and the playgrounds are both
 * (nowrapper) — which is exactly why the group attribute cannot double as the
 * theme hook.
 *
 * hooks.server.ts stamps both for the SSR paint and the root layout keeps them
 * in sync on client-side navigation; both call these, so the two paths cannot
 * disagree.
 */

export type Group = 'main' | 'nowrapper'
export type Theme = 'main' | 'resume' | 'playground'

export function groupFor(routeId: string | null | undefined): Group {
  return (routeId ?? '').includes('(nowrapper)') ? 'nowrapper' : 'main'
}

export function themeFor(routeId: string | null | undefined): Theme {
  const id = routeId ?? ''
  // Only the (nowrapper) playgrounds; /playground under (main) is the index
  // listing, an ordinary site page that wants the site palette.
  if (id.includes('(nowrapper)/playground')) return 'playground'
  if (id.includes('(nowrapper)/resume')) return 'resume'
  // Christmas included: it is standalone, ships its own stylesheet and uses no
  // hyzer components, so it needs no theme of its own.
  return 'main'
}
