<script>
  import { page } from '$app/stores'
  import { TWITTER_ID, SITE_URL } from '$lib/siteConfig'
  import Comments from '$lib/components/Comments.svelte'
  import 'prism-themes/themes/prism-shades-of-purple.min.css'
  import { toc, createTocStore } from '@svelte-put/toc';
  import Toc from '$lib/components/Toc.svelte';

  // table of contents
  const tocStore = createTocStore();

  
  /**
   * @typedef {Object} Props
   * @property {import('./$types').PageData} data
   */

  /** @type {Props} */
  let { data } = $props();

  /** @type {import('$lib/types').ContentItem} */
  let json = $derived(data.json) // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates

  let canonical = $derived(SITE_URL + $page.url.pathname)
</script>

<svelte:head>
  <title>{json.title}</title>
  <meta name="description" content="heffdotdev blog" />

  <link rel="canonical" href={SITE_URL + '/' + json.slug} />
  <meta property="og:url" content={SITE_URL} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={json.title} />
  <meta name="Description" content={json.description} />
  <meta property="og:description" content={json.description} />
  <meta name="twitter:creator" content={'@' + TWITTER_ID} />
  <meta name="twitter:title" content={json.title} />
  <meta name="twitter:description" content={json.description} />
  {#if json.image}
    <meta property="og:image" content={json.image} />
    <meta name="twitter:image" content={json.image} />
  {:else}
    <meta
      content={`https://heffner.dev/og?message=${json.title}`}
      property="og:image"
    />
    <meta
      name="twitter:image"
      content={`https://heffner.dev/og?message=${json.title}`}
    />
  {/if}
  <meta name="twitter:card" content={'summary'} />
</svelte:head>

<a href="/blog" class="back-link"> Back </a>

<Toc {tocStore} />

<article
  use:toc={{ store: tocStore, anchor: false, observe: true, selector: ':where(h1, h2, h3)' }}
  class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8"
>
  <h1 class="text-secondary mb-8 text-3xl font-bold tracking-tight md:text-6xl">
    {json.title}
  </h1>
  <div
    class="bg mt-2 flex w-full justify-between sm:flex-col sm:items-start md:flex-row md:items-center"
  >
    <p class="flex items-center text-sm text-copy">
      tjheffner
    </p>
    <p class="flex items-center text-sm text-copy">
      {new Date(json.date).toISOString().slice(0, 10)}
    </p>
  </div>

  <hr class="mt-2 w-full border-t-2 border-accent" />

  <div class="prose mb-12 mt-12 w-full max-w-none">
    {@html json.content}
  </div>
</article>

<div
  class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8"
>
  <hr class="mt-2 w-full border-t-2 border-accent" />

  <div class="mb-8 w-full">
    <Comments issueNumber={json.issueNumber} />
  </div>


</div>
