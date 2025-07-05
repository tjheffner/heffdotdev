import type { BlogItem } from '$lib/types.js'
import type { PageLoadEvent } from './$types.js'

import { error } from '@sveltejs/kit'

export async function load({ setHeaders, fetch }: PageLoadEvent): Promise<{ items: BlogItem[] }> {
  const res = await fetch(`/api/listContent.json`)

  if (res.status > 400) {
    throw error(res.status, await res.text())
  }

  const items: BlogItem[] = await res.json()
  setHeaders({
    'Cache-Control': 'public, max-age=86400', // 1 day
  })
  return { items }
}
