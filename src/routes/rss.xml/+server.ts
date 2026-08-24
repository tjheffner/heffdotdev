import type { RequestHandler } from './$types'

import RSS from 'rss'
import { SITE_TITLE, SITE_URL } from '$lib/siteConfig'
import { remark } from 'remark'
import remarkHTML from 'remark-html'
// Not prerendered: listContentFromIssues reads GH_TOKEN from
// $env/dynamic/private, which only exists at runtime. s-maxage keeps the edge
// from re-fetching every issue per request.
import { listContentFromIssues } from '$lib/content/content'

export const GET: RequestHandler = async ({ fetch }) => {
  const feed = new RSS({
    title: SITE_TITLE + ' RSS Feed',
    site_url: SITE_URL,
    feed_url: SITE_URL + '/rss.xml',
  })

  const allBlogs = await listContentFromIssues(fetch, 'Published')
  allBlogs.forEach((post) => {
    // extract HTML from markdown
    const htmlDescription = remark()
      .use(remarkHTML)
      .processSync(post.description)

    feed.item({
      title: post.title,
      url: SITE_URL + `/${post.slug}`,
      date: post.date,
      description: htmlDescription.toString(),
    })
  })

  // inject our custom rss stylesheet
  return new Response(
    feed
      .xml({ indent: true })
      .replace(
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet href="/assets/xml/rss.xsl" type="text/xsl"?>`
      ),
    {
      headers: {
        'Cache-Control': `public, max-age=${86400}, s-maxage=${86400}`, // 24 hours
        'Content-Type': 'application/xml; charset=utf-8', // not application/rss+xml
        'x-content-type-options': 'nosniff',
      },
    }
  )
}
