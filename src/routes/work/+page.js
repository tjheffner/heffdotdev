import { error } from '@sveltejs/kit';

export async function load({ params, fetch }) {
	const res = await fetch(`../api/listLocalContent.json`);
	if (res.status > 400) {
		console.log(res)
		throw error(400, 'not found')
	}

	/** @type {import('$lib/types').Project[]} */
	const items = await res.json();

	// let sorted = items.map((item) => {
	// 	return { ...item, date: new Date(item.data.date) };
	// });
	//
	// sorted = sorted.sort((a, b) => Number(b.date) - Number(a.date));

	return { items };
}
