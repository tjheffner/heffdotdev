# heffdotdev
Tanner Heffner's personal website

This site is based on swyxkit, a lightly opinionated starter for Svelte projects:
- SvelteKit + Netlify adapter!
- Tailwind 3 + Tailwind Typography (with [swyx fixes](https://youtu.be/-FzemNMcOGs))
- [JSDoc Typechecking](https://swyxkit.netlify.app/how-to-add-jsdoc-typechecking-to-sveltekit)
- [GitHub Issues as CMS](https://github.com/sw-yx/swyxkit/issues/10)

## Setup
```sh
npm install
npm run start
```

## Optimizations to try after you are done deploying
- Customize your JSON+LD for [FAQ pages](https://rodneylab.com/sveltekit-faq-page-seo/), [organization, or products](https://navillus.dev/blog/json-ld-in-sveltekit). There is a schema for blogposts, but it is so dead simple that swyxkit does not include it.

## Acknowledgements
- Homepage design inspired by Rene Stalder: https://renestalder.me/en/
- swyxkit & swyx.io for so many decisions, but especially github as cms + blog filtering

## Todos
- fix blog index layout + colors
- add projects gallery & pages
- port old blogs
- customize json+ld
- ogimage for unfurls
