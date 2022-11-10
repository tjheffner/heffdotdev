// import { json } from '@sveltejs/kit';
// import { listProjects } from '$lib/localContent';
//
// /**
//  * @type {import('@sveltejs/kit').RequestHandler}
//  */
// export async function GET() {
// 	const list = await listProjects();
// 	return json(list, {
// 		headers: {
// 			'Cache-Control': 'max-age=0, s-maxage=60' // 1 minute.. for now
// 		}
// 	});
// }

// src/routes/api/posts/+server.js
import { fetchMarkdownPosts } from '$lib/localContent'
import { json } from '@sveltejs/kit'

export const GET = async () => {
  const allPosts = await fetchMarkdownPosts()

  const sortedPosts = allPosts.sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })

  return json(sortedPosts)
}
