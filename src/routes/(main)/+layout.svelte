<script>
  import '../../tailwind.css'
  import '../../site.css'
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import Slice from '$lib/components/Slice.svelte'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { SITE_TITLE } from '$lib/siteConfig'

  import { fade } from 'svelte/transition'

  onMount(() => {
    // Indicate that the SvelteKit app has started
    document.body.classList.add("started");
  });

  export let data
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
      class="mx-auto px-4 sm:px-8"
    >
      <slot />
    </main>

  {/key}

<Footer />
