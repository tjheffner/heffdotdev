<script lang="ts">
  import Currently from "$lib/components/Currently.svelte";
  import Metatags from "$lib/components/Metatags.svelte"
  import TableOfContents from "$lib/components/TableOfContents.svelte"
  import type { PageData } from './$types'

  interface Props {
    // data from +page.server.ts, keeps api keys private
    data: PageData;
  }

  let { data }: Props = $props();
  const { recentlyListened, recentlyWatched, recentlyPlayed, duolingo } = data;
</script>

<Metatags title="Recent activity" />

<TableOfContents type="about" toc={{items: []}} />

<h1>Recent activity</h1>
<div id='content'>
  <Currently 
    recentlyListened={recentlyListened} 
    recentlyPlayed={recentlyPlayed} 
    recentlyWatched={recentlyWatched} 
    duolingo={duolingo}
  />
</div>
