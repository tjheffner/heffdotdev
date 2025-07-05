import type { GalleryItem } from '$lib/types.js'
import type { PageLoadEvent } from './$types.js'

import { error } from '@sveltejs/kit'

export async function load({ setHeaders, fetch }: PageLoadEvent): Promise<{ items: GalleryItem[] }> {
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
