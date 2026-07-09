import { json, error } from '@sveltejs/kit'
import { getStore } from '@netlify/blobs'
import type { RequestHandler } from './$types'

// Stores a playground scene under a short code so it can be shared as
// `/p/<code>` instead of a long `?s=<token>` URL. Backed by Netlify Blobs — no
// database to provision. The key is derived from a hash of the token, so
// re-sharing the same scene reuses its code (no unbounded growth).

// Tokens are our compact base36 scene codes: `k1~…` / `t1~…` / `g1~…`.
const TOKEN_RE = /^[gkt]1[~._\-a-z0-9]+$/i
// Only ever redirect back to a playground page (guards against open redirects).
const PAGE_RE = /^\/playground\/[a-z-]+$/
const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function randomCode(len = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length]
  return s
}

async function hashCode(token: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  )
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length]
  return s
}

type Record = { p: string; s: string }

export const POST: RequestHandler = async ({ request }) => {
  let body: { token?: string; page?: string }
  try {
    body = await request.json()
  } catch {
    throw error(400, 'invalid body')
  }
  const token = String(body.token ?? '')
  const page = String(body.page ?? '')
  if (!TOKEN_RE.test(token) || token.length > 4000)
    throw error(400, 'invalid token')
  if (!PAGE_RE.test(page)) throw error(400, 'invalid page')

  const store = getStore({ name: 'scenes', consistency: 'strong' })

  // Deterministic key: identical scene → identical code, so repeat "Copy link"
  // clicks don't pile up entries. On the vanishingly rare hash collision with a
  // *different* scene, fall back to a random code.
  const key = await hashCode(token)
  const existing = (await store.get(key, { type: 'json' })) as Record | null
  if (existing) {
    if (existing.s === token) return json({ code: key })
    let alt = ''
    for (let i = 0; i < 6 && !alt; i++) {
      const c = randomCode()
      if (!(await store.get(c))) alt = c
    }
    if (!alt) throw error(503, 'unavailable')
    await store.setJSON(alt, { p: page, s: token } satisfies Record)
    return json({ code: alt })
  }

  await store.setJSON(key, { p: page, s: token } satisfies Record)
  return json({ code: key })
}
