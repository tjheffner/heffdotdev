import { error } from '@sveltejs/kit'
// export const prerender = true; // turned off so it refreshes quickly
export async function load({ setHeaders, fetch }) {
  const res = await fetch(`/api/listGallery.json`)

  if (res.status > 400) {
    throw error(res.status, await res.text())
  }

  /** @type {import('$lib/types').GalleryItem[]} */
  const items = await res.json()
  setHeaders({
    'Cache-Control': 'public, max-age=86400', // 1 day
  })
  return { items }
}
