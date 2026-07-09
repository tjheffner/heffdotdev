import type { PageServerLoadEvent } from './$types'
import { LASTFM_API_KEY, STEAM_API_KEY } from '$env/static/private'
import {
  LASTFM_ID,
  LETTERBOXD_ID,
  STEAM_ID,
  DUOLINGO_ID,
} from '$lib/siteConfig'
import letterboxd from 'letterboxd'

// These are all third-party endpoints — several are unofficial/undocumented
// (the Duolingo one especially) and can go down, rate-limit, or change shape
// without notice. This page is server-rendered per request, so any single
// source throwing would 500 the whole page. Every source below degrades to an
// empty result instead, and the components tolerate empty data.
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
    console.error(`[about/latest] ${label} fetch failed:`, error)
    return null
  }
}

export async function load({ fetch }: PageServerLoadEvent): Promise<{
  recentlyWatched: any[]
  recentlyListened: any[]
  recentlyPlayed: any
  duolingo: any
}> {
  // last.fm — recently played songs
  const lastfm_json = await safeJson(
    fetch,
    `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_ID}&api_key=${LASTFM_API_KEY}&format=json`,
    'last.fm'
  )
  const recentlyListened = lastfm_json?.recenttracks?.track?.slice(0, 5) ?? []

  // letterboxd — recently watched movies (scrapes the RSS feed)
  let recentlyWatched: any[] = []
  try {
    const items = await letterboxd(LETTERBOXD_ID)
    recentlyWatched = items.slice(0, 5)
  } catch (error) {
    console.error('[about/latest] letterboxd fetch failed:', error)
  }

  // Steam — recently played games
  const steam_json = await safeJson(
    fetch,
    `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}`,
    'Steam'
  )
  const recentlyPlayed = steam_json?.response ?? {}

  // Duolingo — unofficial endpoint, may break without notice
  const duolingo_json = await safeJson(
    fetch,
    `https://www.duolingo.com/2017-06-30/users?username=${DUOLINGO_ID}`,
    'Duolingo'
  )
  const duolingo = duolingo_json?.users?.[0] ?? {}

  return {
    recentlyListened,
    recentlyWatched,
    recentlyPlayed,
    duolingo,
  }
}
