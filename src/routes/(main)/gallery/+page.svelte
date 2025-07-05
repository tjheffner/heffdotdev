<script lang="ts">
  import GalleryItem from "$lib/components/GalleryItem.svelte";
  import Metatags from "$lib/components/Metatags.svelte"

  let { data } = $props();
  let { items } = data
</script>

<Metatags 
  title="Gallery"
  description="part photo gallery, part adventure log"
  ogMessage="Photo Gallery"
/>

<section data-density-shift id="content"  tabindex="-1">
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
