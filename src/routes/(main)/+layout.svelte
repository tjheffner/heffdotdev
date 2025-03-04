<script>
  import '../../tailwind.css'
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
    class="max-w-7xl mx-auto flex flex-col justify-center px-4 sm:px-8 bg-background prose-invert"
  >
    <slot />

    <a href="#maincontent" class="font-bold text-accent md:mx-4 lg:mx-12"
      >Back to top</a
    >
  </main>

  <Footer />
{/key}
