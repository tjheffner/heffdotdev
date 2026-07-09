import { json } from './christmas'

// Static invite data, so prerender it to a real HTML file. Same reason as
// /resume: otherwise the [slug=string] catch-all can pick up /christmas and
// 404 it as an unknown content slug.
export const prerender = true

export const load = async () => {
  return {
    ...json,
  }
}
