import { SITE_URL } from '$lib/siteConfig';
import { listContent } from '$lib/content';
import { fetchMarkdownPosts } from '$lib/localContent'

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ fetch }) {
  const posts = await listContent(fetch);
  const projects = await fetchMarkdownPosts()
	const pages = [`about`, 'resume', 'blogroll', 'christmas', 'blog', 'work'];
	const body = sitemap(posts, projects, pages);

	return new Response(body, {
		headers: {
      'Cache-Control': `public, max-age=${86400}`, // 24 hours
			'Content-Type': 'application/xml'
		}
	});
}

const sitemap = (posts, projects, pages) => `<?xml version="1.0" encoding="UTF-8" ?>
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
			.map((page) => `
        <url>
          <loc>${SITE_URL}/${page}</loc>
        </url>
        `
			).join('')}
    ${posts
			.map((post) =>
				post.isPrivate
					? null
					: `
        <url>
          <loc>${SITE_URL}/${post.slug}</loc>
          <lastmod>${post.ghMetadata.updated_at ? post.ghMetadata.updated_at.substring(0, 10) : post.ghMetadata.created_at.substring(0, 10)}</lastmod>
        </url>
        `
			).join('')}
    ${projects
			.map((project) =>
				project.isPrivate
					? null
					: `
        <url>
          <loc>${SITE_URL}/work/${project.slug}</loc>
        </url>
        `
			).join('')}
  </urlset>`;
