import { error, redirect } from '@sveltejs/kit'
import { goto } from '$app/navigation'
import { REPO_URL } from '$lib/siteConfig'

export const csr = true // https://github.com/sveltejs/kit/pull/6446
export async function load({ params, fetch, setHeaders }) {
  const slug = params.slug

  let res = null
  res = await fetch(`/api/getContent/${slug}.json`)
  if (res.status > 400) {
    throw error(res.status, await res.text())
  }
  const json = await res.json()

  // because [slug] is a catchall, it gets gallery slugs too. redirect them.
  // e.g. /japan -> /gallery/japan
  if (json.type === 'gallery') {
    redirect(308, `/gallery/${json.slug}`)
  }

  setHeaders({
    'Cache-Control': 'public, max-age=60',
  })
  return {
    json,
    slug,
    REPO_URL,
  }
}
