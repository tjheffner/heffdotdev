# heffdotdev
Tanner Heffner's personal website

This site is based on swyxkit, a lightly opinionated starter for Svelte projects:

- SvelteKit + Netlify adapter!
- Tailwind 3 + Tailwind Typography (with [swyx fixes](https://youtu.be/-FzemNMcOGs))
- [JSDoc Typechecking](https://swyxkit.netlify.app/how-to-add-jsdoc-typechecking-to-sveltekit)
- [GitHub Issues as CMS](https://github.com/sw-yx/swyxkit/issues/10)

## Setup
create `.env` file with these values:
```
GH_TOKEN=
LASTFM_API_KEY=
STEAM_API_KEY=
```

```sh
npm install
npm run start
```

## Acknowledgements
- swyxkit & swyx.io for so many decisions, but especially github as cms + blog filtering
- Slice component design inspired by Rene Stalder: https://renestalder.me/en/
- Geoff Rich for dynamic og images https://geoffrich.net/posts/svelte-social-image/
