// src/routes/api/posts/+server.js
import { fetchMarkdownPosts } from '$lib/localContent';
import { json } from '@sveltejs/kit';

export const GET = async () => {
	const allPosts = await fetchMarkdownPosts();

	const sortedPosts = allPosts.sort((a, b) => {
		return new Date(b.date) - new Date(a.date);
	});

	return json(sortedPosts);
};
