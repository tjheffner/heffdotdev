import type { RequestHandler } from './$types'
import { dev } from '$app/environment'
import { read } from '$app/server'
import { ImageResponse } from '@ethercorps/sveltekit-og'
import OpenGraphImage from '$lib/components/OpenGraphImage.svelte'

// Satori rasterises through a wasm build of resvg, because Workers cannot load
// the native @resvg/resvg-js addon. sveltekit-og wraps satori + resvg-wasm and
// its vite plugin (see vite.config.ts) does the wasm bundling Cloudflare needs.

import Merriweather from '$lib/font/Merriweather-Bold.ttf'
import Mulish from '$lib/font/Mulish-Regular.ttf'

const titleFontData = read(Merriweather).arrayBuffer()
const fontData = read(Mulish).arrayBuffer()

export const GET: RequestHandler = async ({ url }) => {
  const message = url.searchParams.get('message') ?? undefined

  return new ImageResponse(
    OpenGraphImage,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Merriweather', data: await titleFontData, style: 'normal' },
        { name: 'Mulish', data: await fontData, style: 'normal' },
      ],
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': dev
          ? 'no-cache'
          : 's-maxage=31536000, stale-while-revalidate=31536000',
      },
    },
    { message }
  )
}
