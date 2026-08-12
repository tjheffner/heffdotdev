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
    <!-- auto-end: title/description grows, the date column hugs its content.
         stackBelow="none": the date stays on the right at every width — stacked
         it read as a stray line under the description. -->
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

  .right {
    text-align: right;
    /* the date shouldn't wrap once the title column squeezes it on mobile */
    white-space: nowrap;
    padding-left: var(--space-near);
  }
</style>
