import { test, expect } from './utils'

// Cloudflare applies _headers and _redirects only to responses the static asset
// server produces, so the redirect table and security headers live in
// hooks.server.ts, and the OG image rasterises through wasm. No page test covers
// these three, and each fails silently: a 404 feed, a missing header, a 0-byte
// PNG.

const REDIRECTS = [
  ['/feed', '/rss.xml'],
  ['/rss', '/rss.xml'],
  ['/api/rss.xml', '/rss.xml'],
  ['/about/latest', '/about'],
]

for (const [from, to] of REDIRECTS) {
  test(`${from} redirects to ${to}`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(res.headers()['location']).toBe(to)
  })
}

test('pages carry the security headers', async ({ request }) => {
  const headers = (await request.get('/')).headers()
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
})

// A page cached at the edge under its own max-age=86400 outlives a deploy and
// keeps serving asset hashes that no longer exist, so it renders and then fails
// to hydrate. Asserted as a ceiling rather than a literal: this suite only runs
// against a preview, and previews opt out of the shared cache.
test('HTML responses bound the shared cache TTL', async ({ request }) => {
  for (const path of ['/', '/gallery']) {
    const cc = (await request.get(path)).headers()['cache-control'] ?? ''
    if (/no-store/.test(cc)) continue
    const shared = cc.match(/s-maxage=(\d+)/)
    expect(shared, `${path} has no shared-cache bound: ${cc}`).not.toBeNull()
    expect(Number(shared![1]), `${path} s-maxage`).toBeLessThanOrEqual(60)
  }
})

test('OG image renders a real PNG', async ({ request }) => {
  const res = await request.get('/api/og.png?message=Test')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toBe('image/png')

  const body = await res.body()
  expect(body.byteLength).toBeGreaterThan(1000)
  // PNG magic number. A failed render still answers 200 with an empty body.
  expect([...body.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
})
