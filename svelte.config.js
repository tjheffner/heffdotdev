import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-cloudflare'

const config = {
  preprocess: [vitePreprocess()],

  kit: {
    adapter: adapter(),
    // Served at /_app/version.json. Workers Builds injects the commit SHA into
    // every build, so this is what lets CI wait for *this* commit's preview
    // instead of whatever was uploaded last. Falls back to SvelteKit's
    // timestamp default everywhere else.
    version: { name: process.env.WORKERS_CI_COMMIT_SHA },
  },
}

export default config
