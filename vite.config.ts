// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type UserConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [sveltekit()],
}) satisfies UserConfig
