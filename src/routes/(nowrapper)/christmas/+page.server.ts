import { json } from './christmas'

// Static invite data, so prerender it. Same reason as /resume: otherwise the
// [slug=string] catch-all picks up /christmas and 404s it as an unknown slug.
export const prerender = true

export const load = async () => {
  return {
    ...json,
  }
}
