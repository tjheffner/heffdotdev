<script>
  import { MY_TWITTER_HANDLE, SITE_URL } from '$lib/siteConfig'
  import Comments from '$lib/components/Comments.svelte'

  import 'prism-themes/themes/prism-shades-of-purple.min.css'
  import { page } from '$app/stores'

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
  <meta name="twitter:creator" content={'@' + MY_TWITTER_HANDLE} />
  <meta name="twitter:title" content={json.title} />
  <meta name="twitter:description" content={json.description} />
  {#if json.image}
    <meta property="og:image" content={json.image} />
    <meta
      name="twitter:card"
      content={json.image ? 'summary_large_image' : 'summary'}
    />
    <meta name="twitter:image" content={json.image} />
  {:else}
    <meta
      content={`https://heffner.dev/og?message=${json.title}`}
      property="og:image"
    />
    <meta
      name="twitter:card"
      content={`https://heffner.dev/og?message=${json.title}`
        ? 'summary_large_image'
        : 'summary'}
    />
    <meta
      name="twitter:image"
      content={`https://heffner.dev/og?message=${json.title}`}
    />
  {/if}
</svelte:head>

<a href="/gallery" class="back-link"> Back </a>

<article
  class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8"
>
  {#if json.title}
    <div class="mb-12">
      <h1
        class="text-shadow text-3xl font-bold tracking-tight text-amber-600 md:text-6xl dark:text-yellow-400"
      >
        {json.title}
        <span class="text-unshadow text-base text-slate-500 dark:text-gray-600"
          >({json.date.slice(0, 4)})</span
        >
      </h1>
    </div>
  {/if}

  <div class="prose mb-12 w-full max-w-none dark:prose-invert">
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
