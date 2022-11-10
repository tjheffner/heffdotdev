import { error } from '@sveltejs/kit';
import { getLocalContent } from '$lib/localContent';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET({ params }) {
	const { slug } = params;
	let data;
	try {
		data = await getLocalContent(slug);
		return new Response(JSON.stringify(data), {
			headers: {
				'Cache-Control': `max-age=0, s-maxage=${60}` // 1 minute.. for now
			}
		});
	} catch (err) {
		return new Response(err.message, { status: 404 });
	}
}
