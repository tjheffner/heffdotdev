import { error } from '@sveltejs/kit'

export async function load({ setHeaders, fetch }) {
  const res = await fetch(`/api/listLocalContent.json`)

  if (res.status > 400) {
    throw error(res.status, await res.text())
  }

  /** @type {import('$lib/types').Project[]} */
  const items = await res.json()
  setHeaders({
    'Cache-Control': 'public, max-age=60', // 1 minute
  })
  return { items }
}
