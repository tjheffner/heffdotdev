// The playground landing page is a static list of experiments with no dynamic
// data, so prerender it to a real HTML file. Otherwise the [slug=string]
// catch-all function picks up /playground and 404s it as an unknown content
// slug (same reason the nowrapper experiments are prerendered). Prerendering
// also means crawlers get the og tags in the served HTML, so it can unfurl.
export const prerender = true
