<script lang="ts">
  interface Props {
    href?: string;
    // gimme full item
    item: any;
    children?: import('svelte').Snippet;
  }

  let { href = '#', item, children }: Props = $props();
</script>

<li data-density-shift class="post">
  <a data-sveltekit-prefetch class="post-link" href={'/' + href}>
    <div class="left">
      <h2>
        {item.title}
      </h2>

      <p>
        {@render children?.()}
      </p>
    </div>

    <div class="right">
      <p class="">{new Date(item.date).toISOString().slice(0, 10)}</p>

      <!-- {#if item.category}
        <span class="category">
          {item.category}
        </span>
      {/if} -->
    </div>
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
    display: flex;
    flex-direction: column;

    @media (min-width: 668px) {
      flex-direction: row;
    }
  }
  .post:hover {
    & h2 {
      color: var(--c-secondary);
    }
  }
  .category {
    width: fit-content;
    border-radius: 2rem;
    background: var(--c-secondary);
    padding: .25rem .5rem;
    color: var(--c-background);
    font-weight: bold;
  }

  .left {
    flex-grow: 1;
  }
  .right {
    text-align: right;
    flex-shrink: 0;
  }
</style>
