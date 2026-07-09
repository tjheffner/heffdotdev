<script lang="ts">
  import type {
    LastfmTrack,
    LetterboxdEntry,
    SteamRecentlyPlayed,
    DuolingoUser,
  } from '$lib/types'

  // Props are promises: the server load streams each source in as it resolves,
  // so this component renders its shell immediately and fills each section on
  // arrival (see routes/(main)/about/latest/+page.server.ts).
  interface Props {
    recentlyListened: Promise<LastfmTrack[]>
    recentlyWatched: Promise<LetterboxdEntry[]>
    recentlyPlayed: Promise<SteamRecentlyPlayed>
    duolingo: Promise<DuolingoUser>
  }

  let {
    recentlyListened,
    recentlyWatched,
    recentlyPlayed,
    duolingo
  }: Props = $props();

  // duolingo math — duolingo may be an empty object if the (unofficial) API
  // was unreachable at load time, so guard every access.
  function duolingoStats(d: DuolingoUser) {
    const currentStreak = d.streakData?.currentStreak;
    const streakStartDate = currentStreak ? new Date(currentStreak.startDate) : null;
    const formattedDate = streakStartDate
      ? streakStartDate.toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric'})
      : '';
    const diff = streakStartDate ? Math.abs(Date.now() - streakStartDate.valueOf()) : 0;
    const days = Math.floor(diff/(86400 * 1000));
    const freezes = days - (d.streak ?? 0);
    return { formattedDate, freezes };
  }

  // https://dev.to/jorik/country-code-to-flag-emoji-a21
  function getFlagEmoji(countryCode: string) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char =>  127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
</script>

<ul class="clean-list">
  <li class="list-item grid">
    <p class="h1">🎶</p>
    <div class="contents" data-density-shift>
      {#await recentlyListened}
        <p class="small">Loading…</p>
      {:then tracks}
        {#each tracks as track}
          <div class="tracklist">
            <img src={track.image.find(i => i.size === 'large')?.['#text']} alt={track.album['#text']}>
            <div>
              <strong>{track.name}</strong>
              <p>{track.artist['#text']}</p>
            </div>
          </div>
        {/each}
      {/await}
    </div>
  </li>

  <li class="list-item grid">
    <p class="h1">🍿</p>
    <div class="contents" data-density-shift>
      {#await recentlyWatched}
        <p class="small">Loading…</p>
      {:then movies}
        {#each movies as movie}
           <p><strong>{movie.film.title}</strong> - <span class="secondary"> {movie.rating.text}</span></p>
           {#if movie.review.length > 0}
            <p class="small">{movie.review}</p>
           {/if}
        {/each}
      {/await}
    </div>
  </li>

  {#await duolingo then d}
    {#if d.courses}
      {@const stats = duolingoStats(d)}
      <li class="list-item grid">
        <p class="h1">🦉</p>
        <div class="contents" data-density-shift>
          {#each d.courses as course}
            <strong>{course.title} {getFlagEmoji(course.learningLanguage)}</strong>
          {/each}

          <p><strong>Current streak:</strong>&nbsp;<strong class="secondary">{d.streak}</strong><sup class="accent">*</sup> days!</p>
          <p>Streak began: <span class="accent">{stats.formattedDate}</span></p>
          <span class="secondary small">
            <span class="accent">*</span>{stats.freezes} days missed. Duolingo plays fast and loose with the meaning of the word "streak"
          </span>
        </div>
      </li>
    {/if}
  {/await}

  <li class="list-item grid">
    <p class="h1">📚</p>
    <div class="contents" data-density-shift>
      <p class="m-0">The last three books I read were:</p>
      <ol>
              <li>
          <strong class="secondary">Trading in the Zone</strong> by <span class="">Mark Douglas</span>
        </li>
        <li>
          <strong class="secondary">Debt: The First 5,000 Years</strong> by <span class="">David Graeber</span>
        </li>
                <li>
          <strong class="secondary">This is How You Lose The Time War</strong> by <span class="">Amal El-Mohtar and Max Gladstone</span>
        </li>
      </ol>
    </div>
  </li>

  <li class="list-item grid">
    <p class="h1">🎮</p>
    <div class="contents" data-density-shift>
      {#await recentlyPlayed}
        <p class="small">Loading…</p>
      {:then played}
        {#if played.games}
          {#each played.games.slice(0, 5) as game }
            <p><strong>{game.name}</strong></p>
            <p class="small"><span class="secondary">{(game.playtime_2weeks / 60).toFixed(0)}</span> hours out of <span class="accent">{(game.playtime_forever / 60).toFixed(0)}</span> total hours played</p>
          {/each}
        {:else}
          <p>No playtime logged on Steam in the last two weeks.</p>
        {/if}
      {/await}
    </div>
  </li>
</ul>


<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(1, 1fr);
    gap: var(--space-near);
  }
  .contents {
    grid-column: span 4 / span 4;
  }

  .list-item {
    margin: var(--space-away) 0;
    padding-bottom: var(--space-away);
    border-bottom: 1px dashed var(--c-secondary);

    > .h1 {
      margin-bottom: 0;
    }
  }

  span.small {
    margin-bottom: var(--space-near);
  }

  .tracklist {
    display: flex;
    flex-direction: row;
    gap: var(--space-near);
    margin-bottom: var(--space-near);
    img {
      max-width: 75px;
    }
  }
</style>
