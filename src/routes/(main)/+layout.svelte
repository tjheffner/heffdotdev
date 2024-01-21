<script>
  import '../../tailwind.css'
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import Slice from '$lib/components/Slice.svelte'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { SITE_TITLE } from '$lib/siteConfig'

  import { fade } from 'svelte/transition'

  let showBackToTop = true

  export let data

  onMount(async () => {
    if ($page.url.pathname === '/') showBackToTop = !showBackToTop
  })
</script>

<svelte:head>
  <link
    rel="alternate"
    type="application/rss+xml"
    title={'RSS Feed for ' + SITE_TITLE}
    href="/rss.xml"
  />
</svelte:head>

<div
  class="flex flex-col justify-center bg-orange-100 px-4 py-12 sm:px-8 dark:bg-slate-900"
>
  <Header />
</div>
<!-- for skip link -->

{#key data.currentRoute}
  <main
    in:fade={{ duration: 150, delay: 150 }}
    out:fade={{ duration: 150 }}
    id="maincontent"
    class="flex flex-col justify-center bg-orange-100 px-4 sm:px-8 dark:bg-slate-900"
  >
    <slot />

    {#if showBackToTop}
      <a href="#maincontent" class="font-bold text-accent md:mx-4 lg:mx-12"
        >Back to top</a
      >
    {/if}
  </main>

  <Footer />
{/key}
