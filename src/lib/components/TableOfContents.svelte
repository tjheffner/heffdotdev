<script lang="ts">
  let { toc, type } = $props();

  // let isOpen = $state(false);
</script>

<section class="full-width post-nav" data-density-shift>
  <div class="wrapper">
    <div class="inside">

      <a href={`/${type}`} class="back-link">Back</a>

      <!-- Only appears on larger screen sizes -->
      <div class="toc" data-density-shift>
        <!-- Dynamic table of contents via @svelte-put/toc -->
        {#if toc.items.size > 1}
          <ul class="toc-list clean-list">
            {#each toc.items.values() as { id, text, element }, index}
              <li>
                <a
                  class="toc-list-item"
                  class:active={toc.activeItem?.id === id}
                  class:parent={element.nodeName === 'H1' || element.nodeName === 'H2'}
                  class:child={element.nodeName === 'H3'}
                  class:grandchild={element.nodeName === 'H4'}
                  href="#{id}"
                >
                {#if index === 0}
                  Introduction
                {:else}
                  {text}
                {/if}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

    </div>
  </div>
</section>

<style>
  .post-nav {
    background-color: var(--c-background);
    position: sticky;
    top: 85px;

    @media (min-width: 668px) {
      top: 100px;
    }
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
    margin: 0 0 var(--space-near) 0;
  }
  .back-link::before {
    margin-right: 0.25rem;
    content: '<';
    color: currentColor;
  }

  .toc {
    position: relative;
  }
  .toc-list {
    display: none;
    margin-left: calc(var(--space-away) * 2);
    padding-left: var(--space-near);

    @media (min-width: 1200px) {
      display: block;
      position: absolute;
    }
  }
  .toc-list-item {
    font-size: 0.8448em;
    text-decoration: none;
    margin: calc(var(--space-near) / 2) 0;
    white-space: nowrap;
    color: var(--c-text);

    padding: 2px 4px;
    background: linear-gradient(
      to bottom,
      var(--c-accent) 0%,
      var(--c-accent) 100%
    );
    background-position: 0 100%;
    background-repeat: repeat-x;
    background-size: 0px 0px;
    transition: all 0.5s linear;
  }
  .toc-list-item.active {
    background-size: 2px 50px;
    color: var(--c-background);
  }

  .parent {
  }
  .child {
    margin-left: var(--space-away)
  }
  .grandchild {
    margin-left: var(--space-away) * 2;
  }
</style>
