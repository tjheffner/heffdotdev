import grayMatter from 'gray-matter'
import { compile } from 'mdsvex'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import rehypeAutoLink from 'rehype-autolink-headings'
import rehypeCdnImages from './rehype-cdn-images.js'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { createHighlighterCore, type ThemeRegistrationRaw } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import langTs from '@shikijs/langs/typescript'
import langJs from '@shikijs/langs/javascript'
import langCss from '@shikijs/langs/css'
import langYaml from '@shikijs/langs/yaml'
import langHtml from '@shikijs/langs/html'
import langPhp from '@shikijs/langs/php'
import rehypeUnescapeCode from './rehype-unescape-code.js'
import { shikiTheme } from './shiki-theme.js'

import type { BaseContentItem, GithubIssue } from '$lib/types.js'

const remarkPlugins = [remarkUnwrapImages]

/**
 * Every language used in a code fence across the archive. Imported one grammar
 * at a time rather than named as strings, because the `shiki` entrypoint pulls
 * in all 722 bundled grammars no matter what you ask for, which alone puts the
 * worker over Cloudflare's size limit.
 */
const CODE_LANGS = [langTs, langJs, langCss, langYaml, langHtml, langPhp]

// Shiki's default oniguruma engine compiles wasm at runtime, which Workers
// forbids. The JS engine covers every grammar in CODE_LANGS without any wasm.
// @shikijs/rehype's default export builds its own highlighter and ignores the
// engine option, so build one here and pass it to the /core plugin. Built once
// and reused, since formatContent runs per request.
let highlighter: Awaited<ReturnType<typeof createHighlighterCore>> | undefined

async function rehypePlugins() {
  highlighter ??= await createHighlighterCore({
    // Ours, built from the site's own palette. See shiki-theme.js.
    themes: [shikiTheme as ThemeRegistrationRaw],
    langs: CODE_LANGS,
    engine: createJavaScriptRegexEngine(),
  })

  return [
    rehypeStringify,
    rehypeSlug,
    rehypeAutoLink,
    rehypeCdnImages,
    // Must run before shiki, which highlights whatever text it's handed. The
    // fences need real characters, not mdsvex's HTML entities.
    rehypeUnescapeCode,
    [
      // unified passes a plugin exactly one options argument, so the
      // highlighter can't ride along in the tuple. Close over it instead.
      function rehypeShiki(options) {
        return rehypeShikiFromHighlighter.call(this, highlighter, options)
      },
      {
        theme: shikiTheme,
        transformers: [
          {
            name: 'surface-from-token',
            pre(node) {
              // Drop shiki's inline background so code-block.css can paint
              // --hz-color-surface-muted instead. An inline style beats any
              // stylesheet, so this is the only way the block follows the
              // palette. The foreground stays; it's the theme's text color.
              const style = node.properties?.style
              if (typeof style === 'string') {
                node.properties.style = style
                  .replace(/background-color:[^;]*;?/g, '')
                  .trim()
              }
            },
          },
        ],
        // Puts language-<lang> back on the <code>. The client upgrade reads it
        // to label CodeBlock's chip.
        addLanguageClass: true,
        // About a third of the fences in the archive have no language. This
        // renders them as plain text instead of leaving them unstyled.
        fallbackLanguage: 'text',
      },
    ],
  ]
}

export function readingTime(text: string): string {
  let minutes = Math.ceil(text.trim().split(' ').length / 225)
  return minutes > 1 ? `${minutes} minutes` : `${minutes} minute`
}

export function slugify(text: string | number): string {
  return text
    .toString()
    .normalize('NFKD') // split accented characters so the strip below drops the accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** The minimum data every page built from a GitHub issue needs. */
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
  // Reduce the description to plain text: markdown first, then any HTML.
  description = remark()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkUnwrapImages)
    .processSync(description)
    .toString()
  description = description.replace(/\n/g, ' ')
  description = description.replace(/<[^>]*>?/gm, '')
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

/**
 * Rewrite raw <img> tags as markdown images so every image goes through the CDN
 * and lazy-loading pass in rehypeCdnImages. GitHub now pastes images as <img>
 * tags rather than ![alt](src), and those would otherwise pass through as
 * opaque HTML. Runs before the youtube/tweet embeds so it doesn't touch the
 * <img> tags they generate.
 */
function normalizeRawImages(content: string): string {
  return content.replace(/<img\b[^>]*?\/?>/gi, (tag) => {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1]
    if (!src) return tag // nothing to rewrite
    const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? ''
    return `![${alt}](${src})`
  })
}

export async function formatContent(content: string): Promise<string> {
  const formatted = normalizeRawImages(content)
    // {% youtube <id or url> %} -> a click-to-play thumbnail
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
    // {% tweet <id or url> %} -> twitter's own embed
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

  const output = (
    await compile(formatted, {
      remarkPlugins,
      // @ts-ignore
      rehypePlugins: await rehypePlugins(),
      // mdsvex highlights with PrismJS by default. Shiki does it in the rehype
      // pass above, so turn the built-in off rather than have both fight over
      // the same <pre>.
      highlight: false,
    })
  ).code
    // Unwrap mdsvex's {@html} around code blocks.
    // https://github.com/pngwn/MDsveX/issues/392
    .replace(/>{@html `<code class="language-/g, '><code class="language-')
    .replace(/<\/code>`}<\/pre>/g, '</code></pre>')

  return output
}
