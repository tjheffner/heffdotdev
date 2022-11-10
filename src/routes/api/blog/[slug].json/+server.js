import { getContent } from '$lib/content';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET({ params }) {
	const { slug } = params;
	let data;
	try {
		data = await getContent(slug);
		return new Response(JSON.stringify(data), {
			headers: {
				'Cache-Control': `max-age=0, s-maxage=${60}` // 1 minute.. for now
			}
		});
	} catch (err) {
		// Suggestion (check for correctness before using):
		// return new Response(err.message, { status: 404 });
		return new Response(err.message, { status: 404 });
	};
}
