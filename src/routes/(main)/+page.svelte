<script>
  import Metatags from "$lib/components/Metatags.svelte"
</script>

<Metatags />

<section class="container" id="content" tabindex="-1">
  <h1 class="big-boi">
    Creative technologist passionate about design systems, responsive web
    design and accessibility.
  </h1>
</section>

<style>
  .container {
    /* leftover viewport: the header publishes its measured height; the
       footer is its 90px icon row plus near + away margins (density * 15).
       dvh, not vh — a mobile URL bar inflates vh and adds phantom space. */
    height: calc(100dvh - var(--header-height) - (90px + var(--density) * 15));
    display: flex;
  }
  .big-boi {
    flex-grow: 1;
    align-self: center;
  }
</style>