<script>
  /** @type {import('$lib/types').Project} */
  export let data

  const { content, name, date, description, image, url } = data

  import { TWITTER_ID, SITE_URL } from '$lib/siteConfig'
  import GetInTouch from '$lib/components/GetInTouch.svelte'
</script>

<svelte:head>
  <title>{name}</title>
  <meta name="description" content="heffdotdev | project" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content={name} />
  <meta name="Description" content={description} />
  <meta property="og:description" content={description} />
  <meta name="twitter:card" content={'summary'} />
  <meta name="twitter:creator" content={'@' + TWITTER_ID} />
  <meta name="twitter:title" content={name} />
  <meta name="twitter:description" content={description} />
  {#if image}
    <meta property="og:image" content={image} />
    <meta name="twitter:image" content={image} />
  {:else}
    <meta
      content={`https://heffner.dev/og?message=heffner.dev | ${name}`}
      property="og:image"
    />
    <meta
      name="twitter:image"
      content={`https://heffner.dev/og?message=heffner.dev | ${name}`}
    />
  {/if}
</svelte:head>

<a href="/work" class="back-link">Back </a>

<article
  class="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center px-4 sm:px-8"
>
  {#if name}
    <div class="mb-12">
      <h1
        class="text-shadow text-3xl font-bold tracking-tight text-amber-600 md:text-6xl dark:text-yellow-400"
      >
        {name}
        <span class="text-unshadow text-base text-slate-500 dark:text-gray-600"
          >({date.slice(0, 4)})</span
        >
      </h1>
    </div>
  {/if}

  {#if image}
    <img src={image} alt={name} class="mb-4" />
  {/if}

  <div class="prose mb-12 w-full max-w-none dark:prose-invert">
    {@html content}
  </div>

  {#if url}
    <a class="footer-link font-bold" href={url}>View this project live</a>
  {/if}
</article>

<GetInTouch />
