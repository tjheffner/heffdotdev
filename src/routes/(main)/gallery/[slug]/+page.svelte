<script>
  import { page } from '$app/state'
  import { TWITTER_ID, SITE_URL } from '$lib/siteConfig'
  import Comments from '$lib/components/Comments.svelte'
  import { Toc as TocStore } from '@svelte-put/toc';
  import Toc from '$lib/components/Toc.svelte';

  // table of contents
  const toc = new TocStore({ observe: true, anchor: false, selector: ':where(h1, h2, h3)' });
  
  /**
   * @typedef {Object} Props
   * @property {import('./$types').PageData} data
   */

  /** @type {Props} */
  let { data } = $props();

  /** @type {import('$lib/types').BaseContentItem} */
  let json = $derived(data.json) // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates

  let canonical = $derived(SITE_URL + page.url.pathname)
</script>

<svelte:head>
  <title>{json.title}</title>
  <meta name="description" content="heffdotdev photo gallery" />

  <link rel="canonical" href={canonical} />
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

<Toc {toc} />

<article
  data-density-shift
  use:toc.actions.root
  class="article"
>
  {#if json.title}
    <div class="details">
      <h1>{json.title}</h1>
      <small>({json.date.toString().slice(0, 4)})</small>
    </div>
  {/if}

  <div class="prose">
    {@html json.content}
  </div>
</article>

<hr />

<div>
  <Comments issueNumber={json.issueNumber} />
</div>

<style>
  .article {
    margin: var(--space-near) 0;
  }
  .details {
    display: flex;
    align-items: center;
    gap: var(--space-near);
  }
</style>