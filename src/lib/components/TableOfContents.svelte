<script lang="ts">
  let { toc, type } = $props();

  let isOpen = $state(false);
</script>

<section class="full-width post-nav" data-density-shift>
  <div class="wrapper inside">
    <a href={`/${type}`} class="back-link">Back</a>

    <!-- Only appears on larger screen sizes -->
    <div class="toc">
      <!-- Dynamic table of contents via @svelte-put/toc -->
      {#if toc.items.size > 1}
        <button
          class="toc-button"
          aria-label="{isOpen ? 'Close' : 'Open'} Table of Contents"
          onclick={() => (isOpen = !isOpen)}
        >
          Table of Contents {isOpen ? 'v' : '>'}
        </button>

        <ul class="toc-list">
          {#each toc.items.values() as { id, text }}
            <li>
              <a
                class=""
                class:toc-active={toc.activeItem?.id === id}
                href="#{id}"
              >
              {text}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</section>

<style>
  .post-nav {
    background-color: var(--c-background);
    position: sticky;
    top: 110px;
  }
  .inside {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }

  .back-link {
    font-weight: bold;
    color: var(--c-secondary);
    text-decoration: none;
  }
  .back-link::before {
    margin-right: 0.25rem;
    content: '<';
    color: currentColor;
  }

  .toc-list {
    display: none;
  }
</style>
