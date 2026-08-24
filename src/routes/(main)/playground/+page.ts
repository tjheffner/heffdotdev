// Static list of experiments, no dynamic data, so prerender it to a real HTML
// file. Otherwise the [slug=string] catch-all picks up /playground and 404s it
// as an unknown content slug. Prerendering also puts the og tags in the served
// HTML, so the page can unfurl.
export const prerender = true
