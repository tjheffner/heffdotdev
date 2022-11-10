import { error } from '@sveltejs/kit';
export const csr = true;
export async function load({ url, params, fetch }) {
	const slug = params.slug;
	let res = null;

	res = await fetch(`/api/work/${slug}.json`);
	if (res.status > 400) {
		throw error(res.status, res.message)
	}

	return {
			json: await res.json(),
			slug
	};
}
