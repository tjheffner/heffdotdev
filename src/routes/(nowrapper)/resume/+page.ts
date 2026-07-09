// The resume is fully static content with no dynamic data, so prerender it to a
// real HTML file. This lets Netlify's CDN serve /resume directly (preferStatic)
// instead of letting the [slug=string] catch-all function pick up the request
// and 404 it as an unknown content slug.
export const prerender = true
