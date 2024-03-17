import { LASTFM_API_KEY } from '$env/static/private'
import { LASTFM_ID } from '$lib/siteConfig';


/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
  const lastfm_res = await fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_ID}&api_key=${LASTFM_API_KEY}&format=json`)
  const lastfm_json = await lastfm_res.json()

  // Only surface the 5 most recent tracks
  const recentlyPlayed = lastfm_json.recenttracks.track.slice(0, 5)


  const recentlyWatched = [{name: 'Poor Things', rating: 3}]

  return {
		recentlyPlayed,
    recentlyWatched
	};
}
