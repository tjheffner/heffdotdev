<script lang="ts">
  let {
    recentlyListened,
    recentlyWatched,
    recentlyPlayed,
    duolingo
  } = $props();

  // duolingo math
  const streakStartDate = new Date(duolingo.streakData.currentStreak.startDate);
  const formattedDate = streakStartDate
    .toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric'})
  const today = new Date();
  const diff = Math.abs(today.valueOf() - streakStartDate.valueOf())
  const days = Math.floor(diff/(86400 * 1000))
  const freezes = days - duolingo.streak

  // https://dev.to/jorik/country-code-to-flag-emoji-a21
  function getFlagEmoji(countryCode) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char =>  127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }
</script>

<ul class="clean-list">
  <li class="list-item grid">
    <p class="h1">🎶</p>
    <div class="contents" data-density-shift>
      {#each recentlyListened as track}
        <div class="tracklist">
          <img src={track.image.find(i => i.size === 'large')['#text']} alt={track.album['#text']}>
          <div>
            <strong>{track.name}</strong>
            <p>{track.artist['#text']}</p>
          </div>
        </div>
      {/each}
    </div>
  </li>

  <li class="list-item grid">
    <p class="h1">🍿</p>
    <div class="contents" data-density-shift>
      {#each recentlyWatched as movie}
         <p><strong>{movie.film.title}</strong> - <span class="secondary"> {movie.rating.text}</span></p>
         {#if movie.review.length > 0}
          <p class="small">{movie.review}</p>
         {/if}
      {/each}
    </div>
  </li>

  {#if Object.hasOwn(duolingo, 'courses')}
    <li class="list-item grid">
      <p class="h1">🦉</p>
      <div class="contents" data-density-shift>
        {#each duolingo.courses as course}
          <strong>{course.title} {getFlagEmoji(course.learningLanguage)}</strong>
        {/each}

        <p><strong>Current streak:</strong>&nbsp;<strong class="secondary">{duolingo.streak}</strong><sup class="accent">*</sup> days!</p>
        <p>Streak began: <span class="accent">{formattedDate}</span></p>
        <span class="secondary small">
          <span class="accent">*</span>{freezes} days missed. Duolingo plays fast and loose with the meaning of the word "streak"

          <!-- {#each Array(freezes) as _, index}
            {#if index % 2 == 0}
            🧊
            {:else}
            🥶
            {/if}
          {/each} -->
        </span>
      </div>
    </li>
  {/if}

  <li class="list-item grid">
    <p class="h1">📚</p>
    <div class="contents" data-density-shift>
      <p class="m-0">The last book I read was:</p> 
      <p><strong class="accent">Forest of Noise</strong> by <span class="text-secondary">Mosab Abu Toha</span>.
    </div>
  </li>

  <li class="list-item grid">
    <p class="h1">🎮</p>
    <div class="contents" data-density-shift>
      {#if recentlyPlayed.games}
        {#each recentlyPlayed.games.slice(0, 5) as played }
          <p><strong>{played.name}</strong></p>
          <p class="small"><span class="secondary">{(played.playtime_2weeks / 60).toFixed(0)}</span> hours out of <span class="accent">{(played.playtime_forever / 60).toFixed(0)}</span> total hours played</p>
        {/each}
      {:else}
        <p>No playtime logged on Steam in the last two weeks.</p>
      {/if}
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