import { test, expect } from './utils'

// Cloudflare applies its _headers and _redirects files only to responses the
// static asset server produces, so the redirect table and the security headers
// live in hooks.server.ts instead, and the OG image rasterises through wasm
// because Workers can't load a native addon. None of the three is covered by a
// page test, and all three fail silently — a 404 feed, a missing header, a
// 0-byte PNG — so they get checked here.

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
// to hydrate. The bound has to hold for routes that set their own header too.
test('HTML responses bound the shared cache TTL', async ({ request }) => {
  for (const path of ['/', '/gallery']) {
    const cc = (await request.get(path)).headers()['cache-control'] ?? ''
    expect(cc, `${path} cache-control`).toContain('s-maxage=60')
  }
})

test('OG image renders a real PNG', async ({ request }) => {
  const res = await request.get('/api/og.png?message=Test')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toBe('image/png')

  const body = await res.body()
  expect(body.byteLength).toBeGreaterThan(1000)
  // PNG magic number — a failed render still answers 200 with an empty body.
  expect([...body.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
})
