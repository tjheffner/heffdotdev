<script lang="ts">
  interface Props {
    title?: string;
    href?: string;
  }

  let { title = 'Untitled post', href = '#' }: Props = $props();
</script>

<a data-sveltekit-prefetch {href} class="!bg-unset">
  <div
    class="card flex h-full rounded-xl border-4 p-2 text-center align-middle transition-all border-slate-500 hover:border-yellow-800 hover:bg-yellow-400"
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
