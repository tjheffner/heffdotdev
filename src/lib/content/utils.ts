import grayMatter from 'gray-matter'
import { compile } from 'mdsvex'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import rehypeAutoLink from 'rehype-autolink-headings'
import rehypeZoomImages from './rehype-wrap-img.js'

import type { BaseContentItem, GithubIssue } from '$lib/types.js'

const remarkPlugins = [remarkUnwrapImages]
const rehypePlugins = [
  rehypeStringify,
  rehypeSlug,
  rehypeAutoLink,
  rehypeZoomImages,
]

export function readingTime(text: string): string {
  let minutes = Math.ceil(text.trim().split(' ').length / 225)
  return minutes > 1 ? `${minutes} minutes` : `${minutes} minute`
}

export function slugify(text: string | number): string {
  return text
    .toString() // Cast to string (optional)
    .normalize('NFKD') // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .toLowerCase() // Convert the string to lowercase letters
    .trim() // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, '-') // Replace spaces with hyphen
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple hyphen with single hyphen
    .replace(/(^-|-$)/g, '') // Remove leading or trailing hyphen
}

/**
 * All pages built from github issue should contain this data at minimum
 */
export function baseIssueContent(issue: GithubIssue): BaseContentItem {
  const src = issue.body
  const { content, data } = grayMatter(src)
  let title = data.title ?? issue.title
  let slug
  if (data.slug) {
    slug = data.slug
  } else {
    slug = slugify(title)
  }

  let description = data.description ?? content.trim().split('\n')[0]
  // extract plain text from markdown
  description = remark()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkUnwrapImages)
    .processSync(description)
    .toString()
  description = description.replace(/\n/g, ' ')
  // strip html
  description = description.replace(/<[^>]*>?/gm, '')
  // strip markdown
  description = description.replace(/[[\]]/gm, '')
  // strip markdown
  description = description.replace(/[[\]]/gm, '')

  return {
    frontmatter: data,
    issueNumber: issue.number,
    slug: slug,
    title,
    description,
    content,
    image: data.image ?? data.cover_image,
    date: new Date(data.date ?? issue.created_at),
    ghMetadata: {
      issueUrl: issue.html_url,
      commentsUrl: issue.comments_url,
      title: issue.title,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      reactions: issue.reactions,
    },
  }
}

export async function formatContent(content: string): Promise<string> {
  const formatted = content
    // replace youtube vids
    .replace(/\n{% youtube (.*?) %}/g, (_, x) => {
      // https://stackoverflow.com/a/27728417/1106414
      function youtube_parser(url) {
        var rx =
          /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/
        return url.match(rx)[1]
      }
      const videoId = x.startsWith('https://') ? youtube_parser(x) : x
      return `<iframe
		class="w-full object-contain"
		srcdoc="
			<style>
					body, .youtubeembed {
				width: 100%;
				height: 100%;
				margin: 0;
				position: absolute;
				display: flex;
				justify-content: center;
				object-fit: cover;
					}
			</style>
			<a
					href='https://www.youtube.com/embed/${videoId}?autoplay=1'
					class='youtubeembed'
			>
					<img
				src='https://img.youtube.com/vi/${videoId}/sddefault.jpg'
				class='youtubeembed'
					/>
					<svg
				version='1.1'
				viewBox='0 0 68 48'
				width='68px'
				style='position: relative;'
					>
				<path d='M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z' fill='#f00'></path>
				<path d='M 45,24 27,14 27,34' fill='#fff'></path>
					</svg>
			</a>
		"
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
		aria-hidden="true"></iframe>`
    })
    // replace tweet embeds
    .replace(/\n{% (tweet|twitter) (.*?) %}/g, (_, _2, x) => {
      const url = x.startsWith('https://twitter.com/')
        ? x
        : `https://twitter.com/x/status/${x}`
      return `
				<blockquote class="twitter-tweet" data-lang="en" data-dnt="true" data-theme="dark">
				<a href="${url}"></a></blockquote>
				<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
				`
    })

  // compile it with mdsvex
  const output = (
    await compile(formatted, {
      remarkPlugins,
      // @ts-ignore
      rehypePlugins,
    })
  ).code
    // https://github.com/pngwn/MDsveX/issues/392
    .replace(/>{@html `<code class="language-/g, '><code class="language-')
    .replace(/<\/code>`}<\/pre>/g, '</code></pre>')
  // lazy load images, if not using rehypeZoomImages
  // .replace(/<img/g, '<img loading="lazy" ')

  return output
}
