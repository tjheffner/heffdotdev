<script lang="ts">
  import type { GalleryItem } from '$lib/types'

  interface Props {
    href?: string;
    item: GalleryItem;
    children?: import('svelte').Snippet;
  }

  let { href = '#', item, children }: Props = $props();
</script>

<li class="gallery-item">
  <div class="left">
    <h2>{item.title}</h2>
    <small>{new Date(item.date).toISOString().slice(0, 4)}</small>
  </div>

  <div class="right">
    <a data-sveltekit-prefetch  data-density-shift class="gallery-link" href={'/gallery/' + href}>
      <img 
        class="gallery-image lazy-image" 
        loading="lazy" 
        src={item.image} alt={item.alt}
        height="100%" width="100%" 
      />

      {item.description}

      {@render children?.()}
    </a>
  </div>

</li>

<style>
  .gallery-item {
    margin-bottom: var(--space-near);
    padding: var(--space-near) 0 var(--space-away);
    border-bottom: 1px var(--c-secondary) dashed;
  }
  .gallery-image {
    max-height: 600px;
    object-fit: cover;
  }
  .gallery-link {
    padding: 0;
  }
  .gallery-link:hover {
    background-size: 4px 100px;
  }

  @media (min-width: 668px) {
    .gallery-item {
      display: flex;
      flex-direction: row;
      margin: var(--space-away) var(--space-near);
      padding: var(--space-near) 0 calc(var(--space-away) * 2);
    }
    .left {
      flex: 1;
    }
    .right {
      flex: 2;
    }
  }
</style>