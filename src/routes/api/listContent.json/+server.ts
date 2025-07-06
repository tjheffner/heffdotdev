import type { RequestEvent } from './$types'
import { listContentFromIssues } from '$lib/content/content'

export async function GET({
  fetch,
  setHeaders,
}: RequestEvent): Promise<Response> {
  const list = await listContentFromIssues(fetch, 'Published')
  setHeaders({
    'Cache-Control': `max-age=0, s-maxage=60`, // 1 minute.. for now
  })
  return new Response(JSON.stringify(list), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
