<script lang="ts">
  import Currently from "$lib/components/Currently.svelte";
  import TableOfContents from "$lib/components/TableOfContents.svelte"

  interface Props {
    // data from +page.server.js, keeps api keys private
    data: any;
  }

  let { data }: Props = $props();
  const { recentlyListened, recentlyWatched, recentlyPlayed, duolingo } = data;
</script>


<TableOfContents type="about" toc={{items: []}} />

<h1>Recent activity</h1>
<div id='#content'>
  <Currently 
    recentlyListened={recentlyListened} 
    recentlyPlayed={recentlyPlayed} 
    recentlyWatched={recentlyWatched} 
    duolingo={duolingo}
  />
</div>
