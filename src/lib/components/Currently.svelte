<script>
  export let recentlyListened
  export let recentlyWatched
  export let recentlyPlayed
</script>

<ul class="divide-y divide-dashed divide-sky-600 dark:divide-blue-300 pl-0">
  <li class="grid grid-cols-currently">
    <p class="my-4 text-3xl">🎶</p>
    <div class="my-4">
      {#each recentlyListened as track}
         <p class="m-0"><strong>{track.artist['#text']}</strong> - {track.name} <span class="text-sm text-accent italic">[{track.album['#text']}]</span></p>
      {/each}
    </div>
  </li>

  <li class="grid grid-cols-currently">
    <p class="my-4 text-3xl">🍿</p>
    <div class="my-4">
      {#each recentlyWatched as movie}
         <p class="m-0"><strong>{movie.film.title}</strong> - <span class="text-secondary"> {movie.rating.text}</span></p>
         {#if movie.review.length > 0}
          <p class="m-0 ml-4 text-sm italic">{movie.review}</p>
         {/if}
      {/each}
    </div>
  </li>

  <li class="grid grid-cols-currently">
    <p class="my-4 text-3xl">📚</p>
    <div class="my-4">
      <p class="m-0"><strong>Thinking, Fast And Slow</strong> by Daniel Kahneman</p>
      <p class="m-0"><strong>The Lathe of Heaven</strong> by Ursula K. Le Guin</p>
      <p class="m-0"><strong>The Art of Sauna Building</strong> by Bert (Pertti) Olavi Jalasjaa</p>
    </div>
  </li>

  <li class="grid grid-cols-currently">
    <p class="my-4 text-3xl">🎮</p>
    <div class="my-4">
      {#each recentlyPlayed.games.slice(0, 5) as played }
        <p class="m-0"><strong>{played.name}</strong></p>
        <p class="m-0 ml-4 text-sm italic"><span class="font-bold text-secondary">{(played.playtime_2weeks / 60).toFixed(0)}</span> hours out of <span class="font-bold text-accent">{(played.playtime_forever / 60).toFixed(0)}</span> total hours played</p>
      {/each}
    </div>
  </li>
</ul>
