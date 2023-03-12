import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import PTSerif from '$lib/font/PTSerif-Regular.ttf';
import { html as toReactNode } from 'satori-html';
import Og from '../../components/Og.svelte';

const height = 630;
const width = 1200;

/** @type {import('./$types').RequestHandler} */
export const GET = async ({ url }) => {
	const message = url.searchParams.get('message') ?? undefined;
	const result = Og.render({ message });
	const element = toReactNode(`${result.html}<style>${result.css.code}</style>`);

	const svg = await satori(element, {
		fonts: [
			{
				name: 'PT Serif',
				data: Buffer.from(PTSerif),
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

	return new Response(image.asPng(), {
		headers: {
			'content-type': 'image/png'
		}
	});
};
