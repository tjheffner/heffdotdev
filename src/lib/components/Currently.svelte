<script>
  export let recentlyPlayed
  export let recentlyWatched
</script>

<ul class="divide-y divide-dashed divide-sky-600 dark:divide-blue-300">

  <li class="grid grid-cols-currently">
    <p class="my-4 text-3xl">🎶</p>
    <div class="my-4">
      {#each recentlyPlayed as track}
         <p class="m-0"><strong>{track.artist['#text']}</strong> - {track.album['#text']}</p>
      {/each}
    </div>
  </li>

  <li class="grid grid-cols-currently">
    <p class="my-4 text-3xl">🍿</p>
    <div class="my-4">
      {#each recentlyWatched as movie}
         <p class="m-0"><strong>{movie.name}</strong> - {movie.rating}</p>
      {/each}
    </div>
  </li>

  <li class="grid grid-cols-currently">
    <p class="my-4 text-3xl">📚</p>
    <div class="my-4">
      <p class="m-0"><strong>Thinking, Fast And Slow</strong> by Daniel Kahneman</p>
    </div>
  </li>

  <li class="grid grid-cols-currently">
    <p class="my-4 text-3xl">🎮</p>
    <div class="my-4">

    </div>
  </li>
</ul>
