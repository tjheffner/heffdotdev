import { json } from '@sveltejs/kit';
import { listProjects } from '$lib/localContent';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET() {
	const list = await listProjects();
	console.log(list);
	return json(list, {
		headers: {
			'Cache-Control': 'max-age=0, s-maxage=60' // 1 minute.. for now
		}
	});
}
