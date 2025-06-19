import { error } from '@sveltejs/kit'
// export const prerender = true; // turned off so it refreshes quickly
export async function load({ setHeaders, fetch }) {
  const res = await fetch(`/api/listContent.json`)

  if (res.status > 400) {
    throw error(res.status, await res.text())
  }

  /** @type {import('$lib/types').BlogItem[]} */
  const items = await res.json()
  setHeaders({
    'Cache-Control': 'public, max-age=60', // 1 minute
  })
  return { items }
}
