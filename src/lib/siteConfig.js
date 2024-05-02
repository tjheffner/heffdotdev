/* general site settings */
export const SITE_URL = 'https://heffner.dev' // 'https://heffner.netlify.app'
export const SITE_TITLE = 'heffner.dev'
export const SITE_DESCRIPTION = 'personal site of tanner heffner'
export const DEFAULT_OG_IMAGE = 'https://heffner.dev/og?message=heffner.dev'
export const GH_USER = 'tjheffner'
export const GH_USER_REPO = 'tjheffner/heffdotdev' // used for pulling github issues and offering comments
export const REPO_URL = 'https://github.com/' + GH_USER_REPO
export const REPO_OWNER = GH_USER_REPO.split('/')[0]

/* for posting */
export const APPROVED_POSTERS_GH_USERNAME = [GH_USER]
export const POST_CATEGORIES = ['Note', 'Recipe', 'Technical', 'DIY']

/* for gathering various stats */
export const TWITTER_ID = 'foodpyramids'
export const LETTERBOXD_ID = 'tjheffner'
export const LASTFM_ID = 'lob_' // need process.env.LASTFM_API_KEY
export const STEAM_ID = '76561197965804852' // need process.env.STEAM_API_KEY
export const DUOLINGO_ID = 'tanner623291'

// dont forget process.env.GH_TOKEN
// if supplied, raises rate limit from 60 to 5000
// https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting
