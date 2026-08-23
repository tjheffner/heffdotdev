// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite'
import { sveltekitOG } from '@ethercorps/sveltekit-og/plugin'
import { defineConfig, type UserConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [sveltekit(), sveltekitOG()],
}) satisfies UserConfig
