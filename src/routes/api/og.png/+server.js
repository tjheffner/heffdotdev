import { dev } from "$app/environment";
import { read } from '$app/server';
import { render } from 'svelte/server';
import satori from 'satori';
import { html as toReactNode } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import OpenGraphImage from '$lib/components/OpenGraphImage.svelte';

// import & load fonts
import Merriweather from '$lib/font/Merriweather-Bold.ttf';
import Mulish from '$lib/font/Mulish-Regular.ttf';

const titleFontData = read(Merriweather).arrayBuffer();
const fontData = read(Mulish).arrayBuffer();

const height = 630;
const width = 1200;

/** @type {import('./$types').RequestHandler} */
export const GET = async ({ url, setHeaders }) => {
  const message = url.searchParams.get('message') ?? undefined;

  const { body, head } = render(OpenGraphImage, { props: { message } })
  const html = toReactNode(`${head}${body}`);

  const svg = await satori(html, {
    fonts: [
      {
        name: 'Merriweather',
        data: await titleFontData,
        style: 'normal'
      },
      {
        name: 'Mulish',
        data: await fontData,
        style: 'normal'
      }
    ],
    height,
    width
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width
    }
  });

  const image = resvg.render();

  setHeaders({
    "Content-Type": "image/png",
    "Cache-Control": dev
      ? "no-cache"
      : "s-maxage=31536000, stale-while-revalidate=31536000"
  });

  return new Response(image.asPng());
};
