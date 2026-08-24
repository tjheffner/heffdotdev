import type { PageServerLoadEvent } from './$types'
import type {
  LastfmTrack,
  LetterboxdEntry,
  SteamRecentlyPlayed,
  DuolingoUser,
} from '$lib/types'
import {
  LASTFM_ID,
  LETTERBOXD_ID,
  STEAM_ID,
  DUOLINGO_ID,
  SITE_URL,
} from '$lib/siteConfig'
import letterboxd from 'letterboxd'
// Runtime secrets, not build-time — see the note in lib/content/content.js.
import { env } from '$env/dynamic/private'
import { ACTIVITY_FIXTURES } from '$lib/server/activityFixtures'

// CI a11y-scans /about, and this page's four third-party sources are both the
// slowest thing on the site to load and the likeliest to fail for reasons that
// have nothing to do with this repo. A request may opt into fixed payloads with
// this header instead. It can't be stubbed browser-side — these calls run here,
// during SSR — so the opt-in has to live in the app.
//
// Fails closed on the canonical host: Workers Builds ships previews to a
// *.workers.dev alias and production to heffner.dev, and unlike Netlify there
// is no per-deploy env var to key off — a version upload carries the same vars
// as production. The host is what actually distinguishes the two. All the
// header can do is swap real activity for static placeholders, but it is still
// untrusted input changing server behaviour.
const FIXTURE_HEADER = 'x-activity-fixtures'

function wantsFixtures(url: URL, request: Request): boolean {
  if (url.hostname === new URL(SITE_URL).hostname) return false
  return request.headers.get(FIXTURE_HEADER) === '1'
}

// These are all third-party endpoints — several are unofficial/undocumented
// (the Duolingo one especially) and can go down, rate-limit, or change shape
// without notice. Every source degrades to an empty result instead of
// throwing, and the components tolerate empty data.
async function safeJson(
  fetch: typeof globalThis.fetch,
  url: string,
  label: string
): Promise<any> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${label} responded ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error(`[about] ${label} fetch failed:`, error)
    return null
  }
}

// last.fm — recently played songs
async function getRecentlyListened(
  fetch: typeof globalThis.fetch
): Promise<LastfmTrack[]> {
  const json = await safeJson(
    fetch,
    `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_ID}&api_key=${env.LASTFM_API_KEY}&format=json`,
    'last.fm'
  )
  return json?.recenttracks?.track?.slice(0, 5) ?? []
}

// letterboxd — recently watched movies (scrapes the RSS feed)
async function getRecentlyWatched(): Promise<LetterboxdEntry[]> {
  try {
    const items = await letterboxd(LETTERBOXD_ID)
    return items.slice(0, 5)
  } catch (error) {
    console.error('[about] letterboxd fetch failed:', error)
    return []
  }
}

// Steam — recently played games
async function getRecentlyPlayed(
  fetch: typeof globalThis.fetch
): Promise<SteamRecentlyPlayed> {
  const json = await safeJson(
    fetch,
    `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${env.STEAM_API_KEY}&steamid=${STEAM_ID}`,
    'Steam'
  )
  return json?.response ?? {}
}

// Duolingo — unofficial endpoint, may break without notice
async function getDuolingo(
  fetch: typeof globalThis.fetch
): Promise<DuolingoUser> {
  const json = await safeJson(
    fetch,
    `https://www.duolingo.com/2017-06-30/users?username=${DUOLINGO_ID}`,
    'Duolingo'
  )
  return json?.users?.[0] ?? {}
}

// Return the promises *unawaited* so SvelteKit streams each source into the
// page as it resolves: the shell renders immediately and slow third-party
// calls fill in independently. Keys stay server-side (this is a .server file).
export function load({ fetch, request, url }: PageServerLoadEvent): {
  recentlyWatched: Promise<LetterboxdEntry[]>
  recentlyListened: Promise<LastfmTrack[]>
  recentlyPlayed: Promise<SteamRecentlyPlayed>
  duolingo: Promise<DuolingoUser>
} {
  // Still promises, so the page streams and renders identically either way.
  if (wantsFixtures(url, request)) {
    return {
      recentlyListened: Promise.resolve(ACTIVITY_FIXTURES.recentlyListened),
      recentlyWatched: Promise.resolve(ACTIVITY_FIXTURES.recentlyWatched),
      recentlyPlayed: Promise.resolve(ACTIVITY_FIXTURES.recentlyPlayed),
      duolingo: Promise.resolve(ACTIVITY_FIXTURES.duolingo),
    }
  }

  return {
    recentlyListened: getRecentlyListened(fetch),
    recentlyWatched: getRecentlyWatched(),
    recentlyPlayed: getRecentlyPlayed(fetch),
    duolingo: getDuolingo(fetch),
  }
}
