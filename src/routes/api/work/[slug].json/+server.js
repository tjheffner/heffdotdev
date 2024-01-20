import { error } from '@sveltejs/kit'
import { fetchMarkdownPost } from '$lib/localContent'

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET({ params }) {
  const { slug } = params
  let data
  data = await fetchMarkdownPost(slug).catch(
    (err) => new Response(err.message, { status: 404 })
  )

  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': `max-age=0, s-maxage=${60}`, // 1 minute.. for now
    },
  })
}
