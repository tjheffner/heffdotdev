<script lang="ts">
  import type { GalleryItem } from '$lib/types'

  interface Props {
    title: string;
    open?: boolean;
    tall?: boolean
    children?: import('svelte').Snippet;
  }

  let { title, children, open = false, tall = false }: Props = $props();
</script>


<details data-density-shift open={open} class:tall={tall}>
  <summary><h2>{title}</h2></summary>

  {@render children?.()}
</details>

<style>
  /* https://css-tricks.com/two-issues-styling-the-details-element-and-how-to-solve-them/
  details {
    border: 2px solid var(--c-accent);
    padding: 0.5rem 1rem;
  } */
  details > summary {
    cursor: pointer;
  }
  details > summary > *:first-child {
    display: inline;
  }

  details {
    interpolate-size: allow-keywords;
    margin-bottom: var(--space-away);
  
    &::details-content {
      transition:
        block-size 1s,
        content-visibility 1s allow-discrete;
      overflow: hidden;
      block-size: 0;     /* Or also:  height:0; */
    }
    
    &[open]::details-content {
      block-size: auto;  /* Or also:  height:auto; */
    }
  }

  /* helpful if the children contain a lot of links */
  details:global(.tall > p) {
    margin-bottom: var(--space-away);
  }
</style>