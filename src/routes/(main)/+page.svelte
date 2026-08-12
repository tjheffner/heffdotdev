<script>
  import Metatags from "$lib/components/Metatags.svelte"
</script>

<Metatags />

<section class="hero" id="content" tabindex="-1">
  <h1 class="big-boi">
    Creative technologist passionate about design systems, responsive web
    design and accessibility.
  </h1>
</section>

<style>
  /* The hero takes whatever the header and footer leave over: #svelte becomes a
     column, main absorbs the slack, the heading centers in it. No measured
     header/footer heights to keep in sync, and min-height (not height) means a
     tall heading on a short screen grows the page instead of clipping.
     Scoped to #svelte, not body — app.html nests the whole app one div deep, so
     a `body > main` child selector never matches. */
  :global(#svelte:has(> main > .hero)) {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }
  /* .wrapper's `margin: auto` would otherwise shrink each row to its own content
     — auto margins on the cross axis eat the free space instead of stretching —
     so the footer collapsed to icon width and its right-aligned social row
     drifted inward. width:100% restores the block-flow width and leaves the auto
     margins doing only the centering. Gated on .wrapper's own breakpoint
     (global.css): below it the margins are fixed, so flex already stretches
     these and 100% would overflow by the margin. Keep the two in sync. */
  @media (width >= 768px) {
    :global(#svelte:has(> main > .hero) > *) {
      width: 100%;
    }
  }
  :global(main:has(> .hero)) {
    flex: 1;
    display: flex;
  }
  .hero {
    flex: 1;
    display: flex;
    align-items: center;
  }
  .big-boi {
    /* the type scale's bottom margin would sit inside the centering box and
       push the heading visibly above center */
    margin-bottom: 0;
  }
</style>