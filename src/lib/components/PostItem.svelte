<script lang="ts">
  import { Split } from '@hyzer-labs/ui'
  import type { BlogItem } from '$lib/types'

  interface Props {
    href?: string;
    // gimme full item
    item: BlogItem;
    children?: import('svelte').Snippet;
  }

  let { href = '#', item, children }: Props = $props();
</script>

<li data-density-shift class="post">
  <a data-sveltekit-prefetch class="post-link" href={'/' + href}>
    <Split fraction="3/4" gap="none" class="post-split">
      <div>
        <h2>
          {item.title}
        </h2>

        <p>
          {@render children?.()}
        </p>
      </div>

      <div class="right">
        <small>{new Date(item.date).toISOString().slice(0, 10)}</small>
      </div>
    </Split>
  </a>
</li>


<style>
  li {
    margin: var(--space-away) 0;
    border-bottom: 1px dashed var(--c-accent);

    &:last-child {
      border-bottom: none;
    }
  }

  .post-link {
    text-decoration: none;
    width: 100%;
    padding: var(--space-away) var(--space-near);
    margin-bottom: var(--space-away);
    display: block;
    color: var(--c-text);
  }
  .post:hover {
    & h2 {
      color: var(--c-secondary);
    }
  }

  /* ponytail: the site column is ~596px at the old 668px viewport breakpoint,
     so retune Split's stack threshold to match; bump if the row flips at the
     wrong width */
  .post-link :global(.hz-split) {
    --hz-width-sm: 600px;
  }
  .right {
    text-align: right;
  }
</style>
