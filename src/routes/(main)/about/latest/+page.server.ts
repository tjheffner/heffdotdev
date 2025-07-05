import type { PageServerLoadEvent } from './$types'
import { LASTFM_API_KEY, STEAM_API_KEY } from '$env/static/private'
import {
  LASTFM_ID,
  LETTERBOXD_ID,
  STEAM_ID,
  DUOLINGO_ID,
} from '$lib/siteConfig'
import letterboxd from 'letterboxd'

export async function load({ fetch, params }: PageServerLoadEvent): Promise<{
  recentlyWatched: any[],
  recentlyListened: any[],
  recentlyPlayed: any[],
  duolingo: any[]
}> {
  // Fetch recently played songs from last.fm
  const lastfm_res = await fetch(
    `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_ID}&api_key=${LASTFM_API_KEY}&format=json`
  )
  const lastfm_json = await lastfm_res.json()
  const recentlyListened = lastfm_json.recenttracks.track.slice(0, 5)

  // Fetch recently watched movies from letterboxd. scrapes rss feed
  let recentlyWatched = []
  await letterboxd(LETTERBOXD_ID)
    .then(function (items) {
      recentlyWatched = items.slice(0, 5)
    })
    .catch(function (error) {
      console.log(error)
    })

  // Fetched recently played games from Steam.
  const steam_res = await fetch(
    `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}`
  )
  const steam_json = await steam_res.json()
  const recentlyPlayed = steam_json.response

  // Fetch stats from Duolingo. This is an unofficial endpoint, may break!!
  const duolingo_res = await fetch(
    `https://www.duolingo.com/2017-06-30/users?username=${DUOLINGO_ID}`
  )
  const duolingo_json = await duolingo_res.json()

  return {
    recentlyListened,
    recentlyWatched,
    recentlyPlayed,
    duolingo: duolingo_json.users[0],
  }
}
