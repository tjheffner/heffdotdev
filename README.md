# heffdotdev

Tanner Heffner's personal website

This site is originally based on swyxkit, a lightly opinionated starter for Svelte projects:

- SvelteKit + Netlify adapter!
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

## Testing

`npm run test` to run the Playwright tests. Locally runs against chromium, CI runs the full browser suite.

Accessibility test reports can be found in `test-results/a11y`. View the files in a local browser.

## Acknowledgements

- swyxkit for many decisions, especially github as cms + blog filtering
- Slice component design inspired by Rene Stalder: https://renestalder.me/en/
- Geoff Rich for dynamic OG images https://geoffrich.net/posts/svelte-social-image/
- Patrick Bacon for sveltekit hydration helper for playwright tests https://spin.atomicobject.com/hydration-sveltekit-tests/
- Donnie D'amato for the resume layout inspiration: https://resume.damato.design/donnie/
- Donnie again for https://complementary.space/
- Stephen Mortenson for the typography scale tool: https://type-scale.spencermortensen.com/
- Josh Comeau for his modern CSS reset: https://www.joshwcomeau.com/css/custom-css-reset
