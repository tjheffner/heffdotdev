<script lang="ts">
  import { Split } from '@hyzer-labs/ui'
  import { cdnImage, cdnSrcset } from '$lib/image'
  import type { GalleryItem } from '$lib/types'

  interface Props {
    href?: string;
    item: GalleryItem;
    children?: import('svelte').Snippet;
  }

  let { href = '#', item, children }: Props = $props();
</script>

<li class="gallery-item">
  <Split fraction="1/3" gap="near">
    <div>
      <h2>{item.title}</h2>
      <small>{new Date(item.date).toISOString().slice(0, 4)}</small>
    </div>

    <div>
      <a data-sveltekit-prefetch class="gallery-link" href={'/gallery/' + href}>
        <img
          class="gallery-image lazy-image"
          loading="lazy"
          src={cdnImage(item.image)}
          srcset={cdnSrcset(item.image)}
          sizes="(min-width: 600px) 66vw, 100vw"
          alt={item.alt}
          height="100%" width="100%"
        />

        {item.description}

        {@render children?.()}
      </a>
    </div>
  </Split>
</li>

<style>
  .gallery-item {
    margin-bottom: var(--space-near);
    padding: var(--space-near) 0 calc(var(--space-away) * 2);
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
  /* ponytail: same retuned stack threshold as PostItem — the old breakpoint
     was 668px of viewport, ~596px of column */
  .gallery-item :global(.hz-split) {
    --hz-width-sm: 600px;
  }

  @media (min-width: 668px) {
    .gallery-item {
      margin: var(--space-away) var(--space-near);
    }
  }
</style>
