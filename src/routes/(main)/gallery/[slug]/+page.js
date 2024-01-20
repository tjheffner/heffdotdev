import { error, redirect } from '@sveltejs/kit';
import { REPO_URL } from '$lib/siteConfig';

export const csr = true; // https://github.com/sveltejs/kit/pull/6446
export async function load({ params, url, fetch, setHeaders }) {
	const slug = params.slug;

	let res = null;
	res = await fetch(`/api/gallery/${slug}.json`);
	if (res.status > 400) {
		throw error(res.status, await res.text());
	}
	setHeaders({
		'Cache-Control': 'public, max-age=60'
	});
	return {
		json: await res.json(),
		slug,
		REPO_URL
	};
}
