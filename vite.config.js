// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite'
import fs from 'fs'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// this is for using local fonts in OG images
function rawFonts(ext) {
  return {
    name: 'vite-plugin-raw-fonts',
    transform(code, id) {
      if (ext.some((e) => id.endsWith(e))) {
        const buffer = fs.readFileSync(id)
        return { code: `export default ${JSON.stringify(buffer)}`, map: null }
      }
    },
  }
}

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [
    sveltekit(),
    rawFonts(['.ttf']),
    nodePolyfills(),
  ],
})
