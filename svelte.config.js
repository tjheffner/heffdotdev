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
      // split:true asked adapter-netlify for one Lambda per route, each with a
      // partial route manifest. Direct loads of /about, /blog and /gallery came
      // back 404 in production while their /__data.json siblings returned 200 —
      // the function was deployed and routing, but SvelteKit inside it didn't
      // match the page. Client-side navigation kept working (it only fetches
      // __data.json), which is why the site looked healthy while every hard
      // refresh, shared link, and crawler hit a 404.
      //
      // split:false is the adapter default: one render function holding the
      // whole manifest, so a route can't go missing from its own bundle.
      split: false,
    }),
  },
}

export default config
