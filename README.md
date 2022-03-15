# heffdotdev
Tanner Heffner's personal website

This is based on swyxkit, a lightly opinionated starter for Svelte projects:
- SvelteKit + Netlify adapter!
- Tailwind 3 + Tailwind Typography (with [swyx fixes](https://youtu.be/-FzemNMcOGs))
- [JSDoc Typechecking](https://swyxkit.netlify.app/how-to-add-jsdoc-typechecking-to-sveltekit)
- [GitHub Issues as CMS](https://github.com/sw-yx/swyxkit/issues/10)

## Key Features and Design Considerations:
- **Features**
  - Dark mode
  - Github-issues-driven Blog with blog index
    - Blog content pulled from the GitHub Issues API
    - Comment and Reaction system from Github Issues
    - 🆕 Shortcodes for [embedding Tweets and YouTube videos](http://swyxkit.netlify.app/supporting-youtube-and-twitter-embeds)
    - Consumes markdown/MDSveX
      - with syntax highlighting
      - fixes for [known MDSvex render issue](https://github.com/pngwn/MDsveX/issues/392)
  - RSS (at `/api/rss.xml`) with caching
- **Performance/Security touches**
  - set [`s-maxage`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#s-maxage) (not `max-age`) to 1 minute to cache (consider making it 1-7 days on older posts)
    - for API endpoints as well as pages
  - Security headers in `netlify.toml`
    - [X-Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
    - [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
    - [X-XSS-Protection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection)
    - SvelteKit does not yet support [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) - [PR pending here](https://github.com/sveltejs/kit/pull/2394/files)
  - [Builds and Deploys in ~40 seconds on Netlify](https://app.netlify.com/sites/swyxkit/deploys)
- **Minor design/UX touches**
  - Top level blog URLs (`/myblog` instead of `/blog/myblog` - [why](https://www.swyx.io/namespacing-sites/))
  - Blog index truncates at 20 posts to make sure to render quickly
  - [Comments are rendered and sanitized](https://github.com/developit/snarkdown/issues/70)
  - Error page (try going to URL that doesnt exist)
    - including nice error when github api rate limit exceeded - fix with `GH_TOKEN`
  - Navlink hover effect
  - [Mobile/Responsive styling](https://swyxkit.netlify.app/mobileresponsive-styling-with-tailwind)
    - Mobile menu with animation
  - Og:image and meta tags for social unfurls (not automatically generated though)
  - Accessibility
    - SVG Icons https://github.com/sw-yx/spark-joy/blob/master/README.md#general--misc
    - [Tap targets](https://web.dev/tap-targets/?utm_source=lighthouse&utm_medium=lr)
  - Custom scrollbar https://css-tricks.com/strut-your-stuff-with-a-custom-scrollbar/
  - Defensive CSS touches https://ishadeed.com/article/defensive-css
- **Code Quality**
  - [JSDoc Typechecking](https://swyxkit.netlify.app/how-to-add-jsdoc-typechecking-to-sveltekit)
  - ESLint + Prettier
  - [Nightly lockfile upgrades](https://mobile.twitter.com/FredKSchott/status/1489287560387956736)

## Setup
```bash
npm install
npm run start
```

## Optimizations to try after you are done deploying
- Customize your JSON+LD for [FAQ pages](https://rodneylab.com/sveltekit-faq-page-seo/), [organization, or products](https://navillus.dev/blog/json-ld-in-sveltekit). There is a schema for blogposts, but it is so dead simple that swyxkit does not include it.

## Acknowledgements

- Design from Lee Robinson: https://github.com/leerob/leerob.io/
- Homepage design from Rene Stalder: https://renestalder.me/en/
- MDSvex from Pngwn is amazing https://mdsvex.pngwn.io/docs#layout
- Other people's code I borrowed from
  - https://github.com/mvasigh/sveltekit-mdsvex-blog
  - https://github.com/sveltejs/kit/blob/master/examples/hn.svelte.dev/src/routes/%5Blist%5D/rss.js
  - RSS
    - https://scottspence.com/posts/make-an-rss-feed-with-sveltekit
    - https://www.davidwparker.com/posts/how-to-make-an-rss-feed-in-sveltekit
    - Reasons it is hard to do dynamic RSS in Sveltekit:
      - Sveltekit Endpoints dont take over from Sveltekit dynamic param routes (`[slug].svelte` has precedence over `rss.xml.js`)
      - RSS Endpoint runs locally but doesnt run in Netlify bc no access to the content in prod ([SvelteKit issue](https://github.com/sveltejs/kit/issues/3535))
- Find more sveltekit projects at https://github.com/janosh/awesome-svelte-kit

## Todos

- implement etag header for github api
- store results in netlify build cache
- separate hydration path for mobile nav (so that we could `hydrate=false` some pages)
- custom components in MDX, and rehype plugins

- add filter to blogs for different categories
- fix layout
- fix colors
- add projects gallery & pages
- port old blogs?
- customize json+ld
