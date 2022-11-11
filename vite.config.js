// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit({
		extensions: [".svx"],
		preprocess: mdsvex(),
	})]
};

export default config;
