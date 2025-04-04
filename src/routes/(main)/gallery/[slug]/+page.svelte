<script>
  import { page } from '$app/stores'
  import { TWITTER_ID, SITE_URL } from '$lib/siteConfig'
  import Comments from '$lib/components/Comments.svelte'
  import 'prism-themes/themes/prism-shades-of-purple.min.css'
  import { toc, createTocStore } from '@svelte-put/toc';
  import Toc from '$lib/components/Toc.svelte';

  // table of contents
  const tocStore = createTocStore();

  /** @type {import('./$types').PageData} */
  export let data

  /** @type {import('$lib/types').ContentItem} */
  $: json = data.json // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates

  $: canonical = SITE_URL + $page.url.pathname
</script>

<svelte:head>
  <title>{json.title}</title>
  <meta name="description" content="heffdotdev photo gallery" />

  <link rel="canonical" href={SITE_URL} />
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
  <meta
    name="twitter:card"
    content={'summary'}
  />
</svelte:head>

<a href="/gallery" class="back-link"> Back </a>

<Toc {tocStore} />

<article
  use:toc={{ store: tocStore, anchor: false, observe: true, selector: ':where(h1, h2, h3)' }}
  class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8"
>

  {#if json.title}
    <div class="mb-12 flex items-end">
      <h1
        class="text-3xl font-bold tracking-tight text-secondary md:text-6xl"
      >
        {json.title}
      </h1>
      <span class="text-copy ml-2"
        >({json.date.slice(0, 4)})</span
      >
    </div>
  {/if}

  <div class="prose mb-12 w-full max-w-none">
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
