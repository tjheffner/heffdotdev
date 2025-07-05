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
    height: calc(100vh - 350px);
    display: flex;
  }
  .big-boi {
    flex-grow: 1;
    align-self: center;
  }
</style>