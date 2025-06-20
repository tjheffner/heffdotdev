<script lang="ts">
  import '../../site.css'
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import { onMount } from 'svelte'
  import { SITE_TITLE } from '$lib/siteConfig'

  import { fade } from 'svelte/transition'

  onMount(() => {
    // Indicate that the SvelteKit app has started
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
      in:fade={{ duration: 150, delay: 150 }}
      out:fade={{ duration: 150 }}
      id="maincontent"
      class=""
    >
      {@render children?.()}
    </main>

  {/key}

<Footer />
