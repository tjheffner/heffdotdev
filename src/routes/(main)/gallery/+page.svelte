<script>
  import Slice from '$lib/components/Slice.svelte'
  export let data
  let { items } = data
</script>

<svelte:head>
  <title>heffner.dev | gallery</title>
  <meta name="description" content="part photo gallery, part adventure log" />
  <meta
    property="og:image"
    content={`https://heffner.dev/og?message=adventure%20log`}
  />
  <meta name="twitter:card" content={'summary'} />
  <meta
    name="twitter:image"
    content={`https://heffner.dev/og?message=adventure%20log`}
  />
</svelte:head>

<section class="mx-auto flex w-full flex-col items-start px-4 sm:p-0">
  <Slice>
    <h1 class="mb-6 text-3xl font-bold tracking-tight text-shadow md:text-5xl">
      Gallery
    </h1>
    <p class="text-xl font-semibold text-accent">
      details, photos<sup class="text-secondary">*</sup>, etc. from past adventures
    </p>
    <p class="text-sm text-secondary mt-2">
      * advance warning many of the pages are very image heavy
    </p>
  </Slice>

  {#each items as trip}
    <Slice title={trip.title} date={trip.date} warn={trip.warn}>
      <a href="/gallery/{trip.slug}" style="display: inline-block" class="gallery-link w-full">
        <img loading="lazy" src={trip.image} alt={trip.alt} class="gallery-image lazy-image" height="100%" width="100%" />
        {'>> ' + trip.description + ' <<'}
      </a>

      {#if trip.title === 'Japan'}
      <p class="text-secondary font-bold text-xs">The above link has <strong>>400 MB</strong> worth of images. Please be on wifi.</p>
      {/if}
    </Slice>
  {/each}

  <p id="warning" class="text-sm text-secondary my-12 mx-0 md:mx-4 lg:mx-12">
    * seriously, this page has at least <span class="text-secondary">40 MB</span> worth of images.
  </p>
</section>

<style>
  .gallery-image {
    max-height: 600px;
    object-fit: cover;
  }
</style>
