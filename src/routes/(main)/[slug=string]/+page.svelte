<script>
  import { page } from '$app/stores'
  import { TWITTER_ID, SITE_URL } from '$lib/siteConfig'
  import Comments from '$lib/components/Comments.svelte'
  import 'prism-themes/themes/prism-shades-of-purple.min.css'
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

<Toc {toc} />

<article 
  use:toc.actions.root
  class=""
>
  <h1 class="">
    {json.title}
  </h1>
  <div class="">
    <p class="">
      tjheffner
    </p>
    <p class="">
      {new Date(json.date).toISOString().slice(0, 10)}
    </p>
  </div>

  <hr class=""/>

  <div class="">
    {@html json.content}
  </div>
</article>

<hr class="" />

<div class="">
  <Comments issueNumber={json.issueNumber} />
</div>
