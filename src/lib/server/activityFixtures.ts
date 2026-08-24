import type {
  LastfmTrack,
  LetterboxdEntry,
  SteamRecentlyPlayed,
  DuolingoUser,
} from '$lib/types'

// Stand-in payloads for /about's four activity sources, shaped like the slices
// the real getters return: already trimmed to 5, already unwrapped from their
// envelopes.
//
// They exist so CI can a11y-scan /about without last.fm, Letterboxd, Steam and
// Duolingo getting a vote on whether the build passes. They can't be stubbed
// from the browser: the calls happen server-side during SSR, and Letterboxd's
// client reaches for node-fetch inside the package rather than the fetch
// SvelteKit hands to `load`. See about/+page.server.ts for how they're opted in.
//
// The Duolingo start date has to be a real parseable date because the page does
// arithmetic on it.
export const ACTIVITY_FIXTURES = {
  recentlyListened: [
    {
      name: 'Fixture Track One',
      artist: { '#text': 'Fixture Artist' },
      album: { '#text': 'Fixture Album' },
      image: [{ size: 'large', '#text': '' }],
    },
    {
      name: 'Fixture Track Two',
      artist: { '#text': 'Fixture Artist' },
      album: { '#text': 'Fixture Album' },
      image: [{ size: 'large', '#text': '' }],
    },
    {
      name: 'Fixture Track Three',
      artist: { '#text': 'Fixture Artist' },
      album: { '#text': 'Fixture Album' },
      image: [{ size: 'large', '#text': '' }],
    },
  ] satisfies LastfmTrack[],

  recentlyWatched: [
    {
      film: { title: 'Fixture Film One' },
      rating: { text: '★★★' },
      review: '',
    },
    {
      film: { title: 'Fixture Film Two' },
      rating: { text: '★★★★' },
      review: 'A fixture review, present so the review branch renders.',
    },
    {
      film: { title: 'Fixture Film Three' },
      rating: { text: '★★' },
      review: '',
    },
  ] satisfies LetterboxdEntry[],

  recentlyPlayed: {
    games: [
      {
        name: 'Fixture Game One',
        playtime_2weeks: 120,
        playtime_forever: 2040,
      },
      { name: 'Fixture Game Two', playtime_2weeks: 0, playtime_forever: 60 },
    ],
  } satisfies SteamRecentlyPlayed,

  duolingo: {
    streak: 100,
    streakData: { currentStreak: { startDate: '2023-05-27' } },
    courses: [{ title: 'Spanish', learningLanguage: 'es' }],
  } satisfies DuolingoUser,
}
