import { error } from '@sveltejs/kit'
import { REPO_URL } from '$lib/siteConfig'
export const csr = true // https://github.com/sveltejs/kit/pull/6446

export async function load({ params, fetch, setHeaders }) {
  const slug = params.slug
  let res = null
  res = await fetch(`/api/work/${slug}.json`)

  if (res.status > 400) {
    throw error(res.status, await res.text())
  }

  const items = await res.json()

  setHeaders({
    'Cache-Control': 'public, max-age=60',
  })
  return {
    ...items,
    slug,
    REPO_URL,
  }
}
