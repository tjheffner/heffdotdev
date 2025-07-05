<script lang="ts">
  import GalleryItem from "$lib/components/GalleryItem.svelte";

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

<section data-density-shift id="#content">
  <h1>Gallery</h1>

  <div>
    <p>
      details, photos<sup class="accent">*</sup>, etc. from past projects and adventures
    </p>
    <small class="accent">
      * advance warning many of the pages are very image heavy
    </small>
  </div>

  <hr />

  <ul class="clean-list">
  {#each items as trip}
    <GalleryItem item={trip} href={trip.slug} />
  {/each}
  </ul>
</section>

<style>
</style>
