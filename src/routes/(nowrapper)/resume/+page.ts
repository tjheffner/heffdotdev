// Static content, so prerender it to a real HTML file. Cloudflare's asset
// server then hands back /resume directly instead of letting the [slug=string]
// catch-all pick up the request and 404 it as an unknown content slug.
export const prerender = true
