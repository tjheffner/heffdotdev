import { error } from '@sveltejs/kit';
export const csr = true;
export async function load({ params, fetch, setHeaders }) {
	const slug = params.slug;
	let res = null;

	res = await fetch(`/api/work/${slug}.json`);
	console.log(res);
	if (res.status > 400) {
		throw error(res.status, await res.text());
	}
	setHeaders({
		'Cache-Control': 'public, max-age=60'
	});

	return {
			json: await res.json(),
			slug
	};
}
