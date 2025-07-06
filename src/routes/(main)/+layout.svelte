<script lang="ts">
  import '../../global.css'
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import { SITE_TITLE } from '$lib/siteConfig'
  import { onMount } from 'svelte'

  import { fade } from 'svelte/transition'

  onMount(() => {
    // Indicate that the SvelteKit app has started. useful for playwright
    document.body.classList.add("started");
  });

  let { data, children } = $props();
</script>

<svelte:head>
  <link
    rel="alternate"
    type="application/rss+xml"
    title={'RSS Feed for ' + SITE_TITLE}
    href="/rss.xml"
  />
</svelte:head>

<Header />

{#key data.currentRoute}
  <main 
    in:fade={{ duration: 200, delay: 200 }}
    out:fade={{ duration: 200 }}
    class="wrapper"
  >
    {@render children?.()}
  </main>
{/key}

<Footer />
