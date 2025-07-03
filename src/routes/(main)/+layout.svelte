<script lang="ts">
  import '../../site.css'
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import { SITE_TITLE } from '$lib/siteConfig'

  import { fade } from 'svelte/transition'

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
    id="maincontent"
    class="wrapper"
  >
    {@render children?.()}
  </main>

{/key}

<Footer />

<style>

</style>