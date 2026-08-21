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
  .post-nav {
    background-color: var(--hz-color-surface);
    position: sticky;
    /* tracks the root font clamp, replacing the old 96px/114px hand-tuning */
    top: var(--header-height);
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
      position: absolute;
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
