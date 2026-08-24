<script lang="ts">
  import { Carousel, Stack } from '@hyzer-labs/ui'
  import type {
    LastfmTrack,
    LetterboxdEntry,
    SteamRecentlyPlayed,
    DuolingoUser,
  } from '$lib/types'

  // Props are promises. The server load streams each source in as it resolves,
  // so the shell renders right away (see routes/(main)/about/+page.server.ts).
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

  // Every group is always a slide, so the dot count stays stable while the
  // third-party calls settle. Each slide awaits its own source inside.
  // `rows` marks the groups that are a list of peer entries, so the dashed
  // rule goes between them. Duolingo is one entry plus a footnote, so no rule.
  const groups = [
    { id: 'music', emoji: '🎶', label: 'recently listened', rows: true },
    { id: 'movies', emoji: '🍿', label: 'recently watched', rows: true },
    { id: 'duolingo', emoji: '🦉', label: 'language learning', rows: false },
    { id: 'books', emoji: '📚', label: 'recently read', rows: true },
    { id: 'games', emoji: '🎮', label: 'recently played', rows: true },
  ]

  // duolingo may be an empty object if the (unofficial) API was unreachable
  // at load time, so guard every access.
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

<Carousel
  items={groups}
  layout="rail"
  loop
  ariaLabel="Recent activity"
  slideLabel={(g) => g.label}
  class="activity-rail"
>
  {#snippet slide(group)}
    <section class="group" data-density-shift data-rows={group.rows ? '' : undefined}>
      <!-- The emoji leads the slide. The title stays in the heading for
           structure and to name the emoji, off screen. -->
      <h3 class="group-head">
        <span class="emoji" aria-hidden="true">{group.emoji}</span>
        <span class="label sr-only">{group.label}</span>
      </h3>

      {#if group.id === 'music'}
        {#await recentlyListened}
          <p class="small">Loading…</p>
        {:then tracks}
          <Stack gap="none">
            {#each tracks as track}
              <p><strong>{track.name}</strong> <span class="secondary">— {track.artist['#text']}</span></p>
            {/each}
          </Stack>
        {/await}

      {:else if group.id === 'movies'}
        {#await recentlyWatched}
          <p class="small">Loading…</p>
        {:then movies}
          <Stack gap="none">
            {#each movies as movie}
              <p>
                <strong>{movie.film.title}</strong>
                <span class="secondary">{movie.rating.text}</span>
                {#if movie.review.length > 0}<span class="small secondary">— {movie.review}</span>{/if}
              </p>
            {/each}
          </Stack>
        {/await}

      {:else if group.id === 'duolingo'}
        {#await duolingo}
          <p class="small">Loading…</p>
        {:then d}
          {#if d.courses}
            {@const stats = duolingoStats(d)}
            <Stack gap="none">
              {#each d.courses as course}
                <p>
                  <strong>{course.title} {getFlagEmoji(course.learningLanguage)}</strong>
                  <span class="secondary">· {d.streak} day streak<sup class="accent">*</sup> since {stats.formattedDate}</span>
                </p>
              {/each}
              <p class="small secondary">
                <span class="accent">*</span>{stats.freezes} days missed. Duolingo plays fast and loose with the meaning of the word "streak"
              </p>
            </Stack>
          {:else}
            <p class="secondary">Duolingo isn't answering right now.</p>
          {/if}
        {/await}

      {:else if group.id === 'books'}
        <Stack gap="none">
          <p><strong class="secondary">Trading in the Zone</strong> — Mark Douglas</p>
          <p><strong class="secondary">Debt: The First 5,000 Years</strong> — David Graeber</p>
          <p><strong class="secondary">This is How You Lose The Time War</strong> — Amal El-Mohtar and Max Gladstone</p>
        </Stack>

      {:else}
        {#await recentlyPlayed}
          <p class="small">Loading…</p>
        {:then played}
          {#if played.games}
            <Stack gap="none">
              {#each played.games.slice(0, 5) as game }
                <p>
                  <strong>{game.name}</strong>
                  <span class="secondary stat">{(game.playtime_2weeks / 60).toFixed(0)}h played / {(game.playtime_forever / 60).toFixed(0)}h total</span>
                </p>
              {/each}
            </Stack>
          {:else}
            <p>No playtime logged on Steam in the last two weeks.</p>
          {/if}
        {/await}
      {/if}
    </section>
  {/snippet}
</Carousel>

<style>
  /* The rail's default slide width is sized for thumbnails, too narrow for a
     track list. This gives about 2 groups in view inside the 65ch wrapper,
     with the third peeking as the "keep scrolling" cue. */
  :global(.activity-rail) {
    /* 48%, not 45%: the icon column costs each row about 58px, and the
       playtime line needs most of it back to hold one line. */
    --hz-carousel-item-width: clamp(16rem, 48%, 21rem);
    /* clear the accordion summary, or the rail's first row starts right
       under "recent activity" */
    margin-top: var(--hz-space-away);
  }

  /* A looping rail hides its scrollbar. The thumb describes a position in a
     fixed range, which is meaningless on content that wraps. @hyzer-labs/ui
     ships this rule in theme/components/carousel.css, and this app loads only
     the token sheet (see routes/+layout.svelte), so it is copied here. Drop
     it if the theme sheet ever gets loaded. */
  :global(.activity-rail .hz-carousel-viewport) {
    scrollbar-width: none;
  }
  :global(.activity-rail .hz-carousel-viewport::-webkit-scrollbar) {
    display: none;
  }

  /* Match the footer's social icons: bare accent glyph, filled on hover. Only
     margin-top here. The row's justify-content and gap come from the library's
     scoped rules at equal specificity and would win anyway. */
  :global(.activity-rail .hz-carousel-controls) {
    margin-top: var(--hz-space-near);
  }
  :global(.activity-rail .hz-button) {
    border: 0;
    border-radius: 8px;
    padding: 0.25rem;
    background: none;
    color: var(--hz-intent-primary);
    transition: all ease-in-out 0.3s;
  }
  :global(.activity-rail .hz-button:hover) {
    background-color: var(--hz-intent-secondary);
    color: var(--hz-color-surface);
  }

  /* Two columns, both starting on row 1: the icon leads the first row and
     every row after it clears the icon's width. That indent makes the gap
     between groups look wider than the spacing alone does. */
  .group {
    /* slides stretch to the tallest in the row, so keep content top-aligned */
    height: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--hz-space-near);
    align-items: start;
  }

  /* The rule separates entries from each other, so it goes between rows
     rather than capping the group. `p + p` means the first row never gets one. */
  .group[data-rows] p + p {
    border-top: 1px dashed var(--hz-intent-secondary);
    padding-top: var(--hz-space-near);
    margin-top: var(--hz-space-near);
  }
  .group-head {
    margin: 0;
  }
  .group-head .emoji {
    display: block;
    font-size: 1.5em;
    line-height: 1;
  }

  /* Stack owns the rhythm between rows. The type scale's paragraph margin
     would stack on top of its gap and undo the tightening. */
  .group p {
    margin: 0;
  }

  /* Game titles come from Steam, so a long one can force a wrap. Keeping the
     stats unbreakable means the line breaks before them, not through them. */
  .group .stat {
    white-space: nowrap;
  }
</style>
