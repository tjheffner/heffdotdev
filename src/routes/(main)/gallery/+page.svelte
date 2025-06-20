<script lang="ts">
  import Slice from '$lib/components/Slice.svelte'
  let { data } = $props();
  let { items } = data
</script>

<svelte:head>
  <title>heffner.dev | gallery</title>
  <meta name="description" content="part photo gallery, part adventure log" />
  <meta
    property="og:image"
    content={`https://heffner.dev/og?message=photo%20gallery`}
  />
  <meta name="twitter:card" content={'summary'} />
  <meta
    name="twitter:image"
    content={`https://heffner.dev/og?message=photo%20gallery`}
  />
</svelte:head>

<section class="">
  <Slice>
    <h1 class="">
      Gallery
    </h1>
    <p class="">
      details, photos<sup class="">*</sup>, etc. from past adventures
    </p>
    <p class="">
      * advance warning many of the pages are very image heavy
    </p>
  </Slice>

  {#each items as trip}
    <Slice title={trip.title} date={trip.date} warn={trip.warn} titleLink={false}>
      <a href="/gallery/{trip.slug}" style="display: inline-block" class="gallery-link">
        <img loading="lazy" src={trip.image} alt={trip.alt} class="gallery-image lazy-image" height="100%" width="100%" />
        {'>> ' + trip.description + ' <<'}
      </a>

      {#if trip.title === 'Japan'}
      <p class="text-secondary font-bold text-xs">The above link has <strong>>500 MB</strong> worth of images. Please be on wifi.</p>
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
  .gallery-link:hover {
    background-size: 4px 100px;
  }
</style>
