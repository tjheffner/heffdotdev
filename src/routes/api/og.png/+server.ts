import type { RequestHandler } from './$types'
import { dev } from '$app/environment'
import { read } from '$app/server'
import { render } from 'svelte/server'
import satori from 'satori'
import { html as toReactNode } from 'satori-html'
import { Resvg } from '@resvg/resvg-js'
import OpenGraphImage from '$lib/components/OpenGraphImage.svelte'

// import & load fonts. this works locally but not on netlify
import Merriweather from './font/Merriweather-Bold.ttf'
import Mulish from './font/Mulish-Regular.ttf'

// const fonts = import.meta.glob('./*.ttf', {
//   query: '?url',
//   import: 'default',
// 	eager: true
// }); // Import all files in this folder ending in .ttf

// const assets = Object.values(fonts); // Array of image URLs

// const titleFontData = await read(assets[0] as string).arrayBuffer()
// const fontData = await read(assets[1] as string).arrayBuffer()

const height = 630
const width = 1200

export const GET: RequestHandler = async ({ url, setHeaders }) => {
  const message = url.searchParams.get('message') ?? undefined

  const { body, head } = render(OpenGraphImage, { props: { message } })
  const html = toReactNode(`${head}${body}`)

  const titleFontData = await read(Merriweather).arrayBuffer()
  const fontData = await read(Mulish).arrayBuffer()

  const svg = await satori(html, {
    fonts: [
      {
        name: 'Merriweather',
        data: titleFontData,
        style: 'normal',
      },
      {
        name: 'Mulish',
        data: fontData,
        style: 'normal',
      },
    ],
    height,
    width,
  })

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  })

  const image = resvg.render()

  setHeaders({
    'Content-Type': 'image/png',
    'Cache-Control': dev
      ? 'no-cache'
      : 's-maxage=31536000, stale-while-revalidate=31536000',
  })

  return new Response(image.asPng())
}
