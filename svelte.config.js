import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-netlify'
import { mdsvex } from 'mdsvex'
import remarkGithub from 'remark-github'
import remarkAbbr from 'remark-abbr'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

// mdsvex config
const mdsvexConfig = {
  // extensions: ['.svelte.md', '.md', '.svx'],
  // layout: {
  //   _: import.meta.dirname + '/src/mdsvexlayout.svelte', // default mdsvex layout
  // },
  remarkPlugins: [
    [
      remarkGithub,
      {
        // Use your own repository
        repository: 'https://github.com/tjheffner/heffdotdev.git',
      },
    ],
    remarkAbbr,
  ],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      {
        behavior: 'wrap',
      },
    ],
  ],
}

const config = {
  extensions: ['.svelte', '.html', '.svx'], // ...mdsvexConfig.extensions
  preprocess: [mdsvex(mdsvexConfig), vitePreprocess()],
  outDir: 'public',

  kit: {
    adapter: adapter({
      edge: true,
      split: false,
    }),
  },
}

export default config
