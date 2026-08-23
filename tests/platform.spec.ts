import { test, expect } from './utils'

// The Netlify -> Cloudflare move pulled the redirect table and the security
// headers out of netlify.toml and into hooks.server.ts, and swapped the OG
// image's rasteriser for a wasm build. None of the three is covered by a page
// test, and all three fail silently (a 404 feed, a missing header, a 0-byte
// PNG), so they get checked here.

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

test('OG image renders a real PNG', async ({ request }) => {
  const res = await request.get('/api/og.png?message=Test')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toBe('image/png')

  const body = await res.body()
  expect(body.byteLength).toBeGreaterThan(1000)
  // PNG magic number — a failed render still answers 200 with an empty body.
  expect([...body.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
})
