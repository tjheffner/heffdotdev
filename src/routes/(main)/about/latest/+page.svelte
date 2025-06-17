<script lang="ts">
  import Currently from "$lib/components/Currently.svelte";

  interface Props {
    // data from +page.server.js, keeps api keys private
    data: any;
  }

  let { data }: Props = $props();
  const { recentlyListened, recentlyWatched, recentlyPlayed, duolingo } = data;
</script>


<a href="/about" class="back-link"> Back </a>

<Currently recentlyListened={recentlyListened} recentlyPlayed={recentlyPlayed} recentlyWatched={recentlyWatched} duolingo={duolingo}/>