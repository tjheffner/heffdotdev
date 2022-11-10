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
		throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
		// Suggestion (check for correctness before using):
		// return new Response(err.message, { status: 404 });
		return {
			status: 404,
			body: err.message
		};
	}
}
