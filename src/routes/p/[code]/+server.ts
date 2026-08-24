import { redirect, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// Expands a short code created by /api/shorten and redirects to the full scene
// URL (which the playground page loads via its ?s= token).
type Record = { p: string; s: string }

export const GET: RequestHandler = async ({ params, platform }) => {
  const code = params.code
  if (!code || !/^[A-Za-z0-9]{4,16}$/.test(code)) throw error(404, 'Not found')

  const store = platform?.env?.SCENES
  if (!store) throw error(404, 'Not found')

  const rec = (await store.get(code, 'json')) as Record | null
  if (!rec || !rec.p || !rec.s) throw error(404, 'Not found')

  throw redirect(302, `${rec.p}?s=${rec.s}`)
}
