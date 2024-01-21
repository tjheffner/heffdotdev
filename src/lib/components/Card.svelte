<script>
  export let title = 'Untitled post'
  export let href = '#'
</script>

<a data-sveltekit-prefetch {href} class="!bg-unset">
  <div
    class="card flex h-full rounded-xl border-4 border-sky-600 p-2 text-center align-middle transition-all hover:border-red-600 hover:bg-red-300 dark:border-slate-500 dark:hover:border-yellow-800 dark:hover:bg-yellow-400"
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
  .dark .card:hover {
    h3 {
      color: black;
    }
  }
</style>
