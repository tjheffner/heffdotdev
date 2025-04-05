import { SITE_URL } from '$lib/siteConfig'
import { listContentFromIssues } from '$lib/content'

export const prerender = true

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ fetch }) {
  const posts = await listContentFromIssues(fetch, 'Published')
  const galleries = await listContentFromIssues(fetch, 'Gallery')
  const pages = ['about', 'resume', 'christmas', 'gallery', 'blog']
  const body = sitemap(posts, pages, galleries)

  return new Response(body, {
    headers: {
      'Cache-Control': `public, max-age=${86400}`, // 24 hours
      'Content-Type': 'application/xml',
    },
  })
}

const sitemap = (
  posts,
  pages,
  galleries
) => `<?xml version="1.0" encoding="UTF-8" ?>
  <urlset
    xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
    xmlns:xhtml="https://www.w3.org/1999/xhtml"
    xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
    xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
    xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
  >
    <url>
      <loc>${SITE_URL}</loc>
    </url>
    ${pages
      .map(
        (page) => `
        <url>
          <loc>${SITE_URL}/${page}</loc>
        </url>
        `
      )
      .join('')}
    ${posts
      .map((post) =>
        post.isPrivate
          ? null
          : `
        <url>
          <loc>${SITE_URL}/${post.slug}</loc>
          <lastmod>${
            post.ghMetadata.updated_at
              ? post.ghMetadata.updated_at.substring(0, 10)
              : post.ghMetadata.created_at.substring(0, 10)
          }</lastmod>
        </url>
        `
      )
      .join('')}
    ${galleries
      .map((gallery) =>
        gallery.isPrivate
          ? null
          : `
        <url>
          <loc>${SITE_URL}/gallery/${gallery.slug}</loc>
          <lastmod>${
            gallery.ghMetadata.updated_at
              ? gallery.ghMetadata.updated_at.substring(0, 10)
              : gallery.ghMetadata.created_at.substring(0, 10)
          }</lastmod>
        </url>
        `
      )
      .join('')}
  </urlset>`
