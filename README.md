# heffdotdev

Tanner Heffner's personal website. SvelteKit, deployed to Cloudflare Workers
with `@sveltejs/adapter-cloudflare`.

Posts are written as GitHub issues in this repo and read at request time. That
idea, and a lot of the early structure, came from
[swyxkit](https://github.com/sw-yx/swyxkit): see
[GitHub Issues as CMS](https://github.com/sw-yx/swyxkit/issues/10).

## Setup

```sh
npm install
npm run start
```

Create a `.env` file with these values:

```
GH_TOKEN=
LASTFM_API_KEY=
STEAM_API_KEY=
```

The site runs without them, but parts of it go quiet:

- `GH_TOKEN` — a GitHub token with read access to this repo's issues. Without
  it, requests to the GitHub API are unauthenticated and capped at 60 per hour
  instead of 5000, so post lists start failing once you reload a few times.
- `LASTFM_API_KEY` — the recently played songs on `/about`. Without it, that
  list is empty.
- `STEAM_API_KEY` — the recently played games on `/about`. Without it, that
  list is empty.

The other two `/about` sources, Letterboxd and Duolingo, need no keys.

The playground share shortener uses the `SCENES` KV namespace, which is not
bound under plain `vite dev`. Locally, share links fall back to the long
`?s=` form. Use `npm run preview` to test the short `/p/<code>` links.

## Scripts

- `npm run start` — dev server on port 5173.
- `npm run build` — production build.
- `npm run preview` — serve the build locally.
- `npm run check` — svelte-check against `tsconfig.json`. `check:watch` keeps
  it running.
- `npm run lint` — what CI runs: a Prettier check, then svelte-check, then
  `tokens:check`.
- `npm run format` — Prettier, writing changes.
- `npm run tokens` — regenerate `src/hyzer-tokens.css` from `hyzer.config.ts`.
  Run this after editing tokens and commit the result. `tokens:check` fails if
  the committed file is stale.

## Testing

`npm run test` runs the Playwright tests. Locally it runs against Chromium and
boots its own dev server. CI runs the full browser suite against a deployed
Cloudflare preview, set through `PLAYWRIGHT_TEST_BASE_URL`.

Accessibility reports land in `test-results/a11y`. Open the files in a browser.

## Acknowledgements

- [swyxkit](https://github.com/sw-yx/swyxkit) for many decisions, especially
  GitHub as CMS and blog filtering
- Geoff Rich for
  [dynamic OG images](https://geoffrich.net/posts/svelte-social-image/)
- Patrick Bacon for the
  [SvelteKit hydration helper](https://spin.atomicobject.com/hydration-sveltekit-tests/)
  used in the Playwright tests
- Donnie D'amato for the
  [resume layout inspiration](https://resume.damato.design/donnie/)
- Donnie again for [complementary.space](https://complementary.space/)
- Stephen Mortensen for the
  [typography scale tool](https://type-scale.spencermortensen.com/)
- Josh Comeau for his
  [modern CSS reset](https://www.joshwcomeau.com/css/custom-css-reset)
