<script lang="ts">
  interface Props {
    title?: string;
    href?: string;
  }

  let { title = 'Untitled post', href = '#' }: Props = $props();
</script>

<a data-sveltekit-prefetch {href} class="card link-bg-unset">
  <div
    class=""
  >
    <h3>
      {title}
    </h3>
  </div>
</a>

<style>
  .card h3 {
    margin: auto;
  }
  .card h3::before {
    display: none;
  }
</style>
