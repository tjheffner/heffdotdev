// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [sveltekit()],
})
