<script lang="ts">
  import { Toc } from '@hyzer-labs/ui'

  // withToc=false renders just the sticky back-link bar (about/latest)
  let { type, withToc = true }: { type: string; withToc?: boolean } = $props();
</script>

<section class="full-width post-nav">
  <div class="wrapper">
    <div class="inside" data-density-shift>

      <a href={`/${type}`} class="back-link">Back</a>

      <!-- Only appears on larger screen sizes -->
      {#if withToc}
        <div class="toc" data-density-shift>
          <Toc container=".article" levels={[1, 2, 3]} title="" minEntries={2}>
            <!-- the level-1 entry is the post title; label it as the top jump -->
            {#snippet entry(e)}
              {e.level === 1 ? 'Introduction' : e.label}
            {/snippet}
          </Toc>
        </div>
      {/if}

    </div>
  </div>
</section>

<style>
  /* Scrolls with the page. It used to be sticky, but the bar is only a "Back"
     link on the page's own background — it did not read as a bar, so content
     passing underneath just looked clipped. The ToC rail below is pinned on
     its own instead, which is the part that actually wants to follow the
     reader. */
  .post-nav {
    background-color: var(--hz-color-surface);
  }
  .inside {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }

  .back-link {
    font-weight: bold;
    color: var(--hz-intent-secondary);
    text-decoration: none;
    margin: 0 0 var(--hz-space-near) 0;
  }
  .back-link::before {
    margin-right: 0.25rem;
    content: '<';
    color: currentColor;
  }

  .toc {
    position: relative;
  }
  .toc :global(.hz-toc) {
    display: none;

    @media (min-width: 1200px) {
      display: block;
      /* Pinned to the viewport rather than riding the nav bar, which now
         scrolls away. `main.wrapper` is max-width 65ch and centred, so its
         right edge sits at 50% + 32.5ch; margin-left keeps the same gap past
         it the absolute version had, and top parks it under the sticky
         header. */
      position: fixed;
      top: var(--header-height);
      left: calc(50% + 32.5ch);
      margin-left: calc(var(--hz-space-away) * 2);
      padding-left: var(--hz-space-near);
    }
  }
  .toc :global(.hz-toc-panel ul) {
    padding: 0;
    list-style-type: none;
  }
  .toc :global(.hz-toc-link) {
    display: inline-block;
    font-size: var(--hz-font-size-sm);
    text-decoration: none;
    margin: calc(var(--hz-space-near) / 2) 0;
    white-space: nowrap;
    color: var(--hz-color-text);

    padding: 2px 4px;
    background: linear-gradient(
      to bottom,
      var(--hz-intent-primary) 0%,
      var(--hz-intent-primary) 100%
    );
    background-position: 0 100%;
    background-repeat: repeat-x;
    background-size: 0px 0px;
    transition: all 0.5s linear;
  }
  /* scroll-spy active entry */
  .toc :global(.hz-toc-link[aria-current='location']) {
    background-size: 2px 50px;
    color: var(--hz-color-surface);
  }
  /* h3 entries indent one step (h4+ aren't collected) */
  .toc :global(.hz-toc-link[data-level='3']) {
    margin-left: var(--hz-space-away);
  }
</style>
