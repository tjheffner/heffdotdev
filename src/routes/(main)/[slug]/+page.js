import { error, redirect } from '@sveltejs/kit';
import { REPO_URL } from '$lib/siteConfig';

export const csr = true; // https://github.com/sveltejs/kit/pull/6446
export async function load({ params, fetch, setHeaders }) {
	const slug = params.slug;

	if (slug === 'feed' || slug === 'rss' || slug === 'rss.xml') {
		throw redirect(308, '/rss.xml')
	}

	let res = null;
	res = await fetch(`/api/getContent/${slug}.json`);
	if (res.status > 400) {
		throw error(res.status, await res.text());
	}
	const json = await res.json()

	// because [slug] is a catchall, it gets the gallery pages too. redirect them.
	if (json.type === 'gallery') {
		throw redirect(308, `/gallery/${json.slug}`)
	}

	setHeaders({
		'Cache-Control': 'public, max-age=60'
	});
	return {
		json,
		slug,
		REPO_URL
	};
}
