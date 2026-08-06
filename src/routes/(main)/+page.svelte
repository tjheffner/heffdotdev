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
  /* The hero takes whatever the header and footer leave over: body becomes a
     column, main absorbs the slack, the heading centers in it. No measured
     header/footer heights to keep in sync, and min-height (not height) means a
     tall heading on a short screen grows the page instead of clipping. */
  :global(body:has(> main > .hero)) {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }
  :global(main:has(> .hero)) {
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