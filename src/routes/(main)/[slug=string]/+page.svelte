<script>
  import { page } from '$app/stores'
  import { TWITTER_ID, SITE_URL } from '$lib/siteConfig'
  import Comments from '$lib/components/Comments.svelte'
  import 'prism-themes/themes/prism-shades-of-purple.min.css'

  /** @type {import('./$types').PageData} */
  export let data

  /** @type {import('$lib/types').ContentItem} */
  $: json = data.json // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates

  $: canonical = SITE_URL + $page.url.pathname
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

<article
  class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8"
>
  <h1 class="text-shadow mb-8 text-3xl font-bold tracking-tight md:text-6xl">
    {json.title}
  </h1>
  <div
    class="bg mt-2 flex w-full justify-between sm:flex-col sm:items-start md:flex-row md:items-center"
  >
    <p class="flex items-center text-sm text-gray-700 dark:text-gray-300">
      tjheffner
    </p>
    <p class="flex items-center text-sm text-gray-600 md:mt-0 dark:text-gray-400">
      {new Date(json.date).toISOString().slice(0, 10)}
    </p>
  </div>

  <hr class="mt-2 w-full border-t-2 border-red-600 dark:border-blue-300" />

  <div class="prose mb-12 mt-12 w-full max-w-none dark:prose-invert">
    {@html json.content}
  </div>
</article>

<div
  class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8"
>
  <hr class="mt-2 w-full border-t-2 border-red-600 dark:border-blue-300" />

  <div class="mb-8 w-full">
    <Comments issueNumber={json.issueNumber} />
  </div>


</div>
