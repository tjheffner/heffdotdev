import { dev } from '$app/environment';

let localContent = [];

// fetch all markdown posts and shape into item with metadata
export const fetchMarkdownPosts = async () => {
	const allPostFiles = import.meta.glob('$lib/content/work/*.svx');
	const iterablePostFiles = Object.entries(allPostFiles);

	const allPosts = await Promise.all(
		iterablePostFiles.map(async ([path, resolver]) => {
			const post = await resolver();
			const { name, url, slug, description, type, date, image } = post.metadata;

			const project = {
				content: post.default.render().html,
				name,
				url,
				slug,
				description,
				type,
				date,
				image,
				path
			};

			return { ...project };
		})
	);

	localContent = allPosts;

	return allPosts;
};

// fetch single markdown post and format it for display
export async function fetchMarkdownPost(slug) {
	if (dev || localContent.length === 0) {
		console.log('loading allProjects');
		localContent = await fetchMarkdownPosts();
		console.log('loaded ' + localContent.length + ' projects');
		if (!localContent.length) throw new Error('failed to load projects for some reason.');
	}

	const project = localContent.find((p) => p.slug === slug);

	return {
		...project
	};
}
