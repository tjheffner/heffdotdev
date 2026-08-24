/* general site settings */
// The apex is the canonical host; a Cloudflare rule redirects www to it. Every
// absolute URL points at the apex so og:image serves a direct 200 with no
// redirect hop, for crawlers that won't follow redirects on images (iMessage).
export const SITE_URL = 'https://heffner.dev'
export const SITE_TITLE = 'heffner.dev'
export const SITE_DESCRIPTION = 'personal site of tanner heffner'
export const DEFAULT_OG_IMAGE = 'https://heffner.dev/api/og.png'
export const GH_USER = 'tjheffner'
export const GH_USER_REPO = 'tjheffner/heffdotdev' // source of the blog posts and comments
export const REPO_URL = 'https://github.com/' + GH_USER_REPO
export const REPO_OWNER = GH_USER_REPO.split('/')[0]

/* for posting */
export const APPROVED_POSTERS_GH_USERNAME = [GH_USER]
export const POST_CATEGORIES = ['Note', 'Recipe', 'Technical', 'DIY']

/* for gathering various stats */
export const TWITTER_ID = 'foodpyramids'
export const LETTERBOXD_ID = 'tjheffner'
export const LASTFM_ID = 'lob_' // needs process.env.LASTFM_API_KEY
export const STEAM_ID = '76561197965804852' // needs process.env.STEAM_API_KEY
export const DUOLINGO_ID = 'tanner623291'

// Needs process.env.GH_TOKEN. With a token the rate limit is 5000/hr, without
// it 60. https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
