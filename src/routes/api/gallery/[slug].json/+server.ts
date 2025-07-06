import type { RequestEvent } from './$types'
import { getContent } from '$lib/content/content'
import { error } from '@sveltejs/kit'

export async function GET({ fetch, params }: RequestEvent): Promise<Response> {
  const { slug } = params
  let data
  try {
    data = await getContent(fetch, slug)
    return new Response(JSON.stringify(data), {
      headers: {
        'Cache-Control': `max-age=0, s-maxage=${60}`, // 1 minute.. for now
      },
    })
  } catch (err) {
    throw error(404, err.message)
  }
}
