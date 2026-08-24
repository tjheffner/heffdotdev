<script lang="ts">
  import { Split } from '@hyzer-labs/ui'
  import type { BlogItem } from '$lib/types'

  interface Props {
    href?: string;
    item: BlogItem;
    children?: import('svelte').Snippet;
  }

  let { href = '#', item, children }: Props = $props();
</script>

<li data-density-shift class="post">
  <a data-sveltekit-prefetch class="post-link" href={'/' + href}>
    <!-- auto-end: title/description grows, the date column hugs its content.
         stackBelow="none" keeps the date on the right at every width. -->
    <Split fraction="auto-end" gap="none" stackBelow="none" class="post-split">
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
    margin: var(--hz-space-away) 0;
    border-bottom: 1px dashed var(--hz-intent-primary);

    &:last-child {
      border-bottom: none;
    }
  }

  .post-link {
    text-decoration: none;
    width: 100%;
    padding: var(--hz-space-away) var(--hz-space-near);
    margin-bottom: var(--hz-space-away);
    display: block;
    color: var(--hz-color-text);
  }
  .post:hover {
    & h2 {
      color: var(--hz-intent-secondary);
    }
  }

  .right {
    text-align: right;
    /* the date shouldn't wrap once the title column squeezes it on mobile */
    white-space: nowrap;
    padding-left: var(--hz-space-near);
  }
</style>
