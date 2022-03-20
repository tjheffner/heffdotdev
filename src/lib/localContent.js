import { compile } from 'mdsvex';
import { resolve, basename } from 'path';
import { promises as fs } from 'fs';
import { dev } from '$app/env';
import grayMatter from 'gray-matter';

import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeAutoLink from 'rehype-autolink-headings';

const remarkPlugins = undefined;
const rehypePlugins = [
	rehypeStringify,
	rehypeSlug,
	[
		rehypeAutoLink,
		{
			behavior: 'wrap',
			properties: { class: 'hover:text-yellow-100 no-underline' }
		}
	]
];

let localContent = [];
// for projects in content/
export async function listProjects() {
	let _localContent = [];
	for await (const _path of getFiles(`content/work`)) {
		const src = await fs.readFile(_path, 'utf8');
		const data = grayMatter(src);

		_localContent.push({
			content: data.content,
			data: data.data,
			slug: data.data.slug ?? basename(_path, '.svx'),
			image: data.image,
			description: data.description,
			title: data.title ?? data.name,
			name: data.name
		});
	}
	localContent = _localContent;

	return _localContent;
}

async function* getFiles(dir) {
	const dirents = await fs.readdir(dir, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = resolve(dir, dirent.name);
		if (dirent.isDirectory()) {
			yield* getFiles(res);
		} else {
			yield res;
		}
	}
}

export async function getLocalContent(slug) {
	// get all content if not already done - or in development
	if (dev || localContent.length === 0) {
		console.log('loading allProjects');
		localContent = await listProjects();
		console.log('loaded ' + localContent.length + ' projects');
		if (!localContent.length) throw new Error('failed to load projects for some reason.');
	}
	if (!localContent.length) throw new Error('no projects');
	// find the content that matches this slug
	const project = localContent.find((p) => p.slug === slug);
	if (project) {
		const blogbody = project.content
			.replace(/\n{% youtube (.*?) %}/g, (_, x) => {
				// https://stackoverflow.com/a/27728417/1106414
				function youtube_parser(url) {
					var rx = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;
					return url.match(rx)[1];
				}
				const videoId = x.startsWith('https://') ? youtube_parser(x) : x;
				return `<iframe
			class="w-full object-contain"
			src="https://www.youtube.com/embed/${videoId}"
			title="video123"
			name="video123"
			allow="accelerometer; autoplay; encrypted-media; gyroscope;
			picture-in-picture"
			frameBorder="0"
			webkitallowfullscreen="true"
			mozallowfullscreen="true"
			width="600"
			height="400"
			allowFullScreen
			aria-hidden="true"></iframe>`;
			})
			.replace(/\n{% (tweet|twitter) (.*?) %}/g, (_, _2, x) => {
				const url = x.startsWith('https://twitter.com/') ? x : `https://twitter.com/x/status/${x}`;
				return `
					<blockquote class="twitter-tweet" data-lang="en" data-dnt="true" data-theme="dark">
					<a href="${url}"></a></blockquote>
					<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
					`;
			});

		// compile it with mdsvex
		const content = (
			await compile(blogbody, {
				remarkPlugins,
				rehypePlugins
			})
		).code
			// https://github.com/pngwn/MDsveX/issues/392
			.replace(/>{@html `<code class="language-/g, '><code class="language-')
			.replace(/<\/code>`}<\/pre>/g, '</code></pre>');

		return { ...project, content };
	} else {
		throw new Error('Project not found for slug: ' + slug);
	}
}

// export async function parseMarkdown({ filePath, markdown }) {
// 	// const result = await remark().use(remarkHtml).process(markdown);
// 	var post_vfile = new VFile({ path: filePath, contents: markdown });
// 	const file = await unified()
// 		.use(_preset)
// 		.process(post_vfile)
// 		.catch((err) => {
// 			console.error(reporter(post_vfile));
// 			throw err;
// 		});
// 	file.extname = '.html';
// 	return file.toString();
// }
