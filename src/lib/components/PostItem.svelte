<script>
  export let href = '#'

  // gimme full item
  export let item
</script>

<a data-sveltekit-prefetch class="post w-full" href={'/' + href}>
  <div class="grid grid-cols-4 px-0 pt-4 sm:p-4">
    <h2 class="col-span-4 text-lg font-bold text-accent sm:col-span-3">
      {item.title}
    </h2>

    <p class="col-span-4 mb-2 text-slate-800 sm:col-span-3 dark:text-gray-400">
      <slot />
    </p>

    {#if item.category}
      <span
        class="col-span-1 col-start-1 mb-2 mr-1 inline-block
        w-fit rounded-full
        bg-orange-300 px-2
				py-1 text-xs font-bold
        text-red-600 text-white md:mr-2 md:px-4 dark:bg-lime-600 dark:text-gray-900
    "
      >
        {item.category}
      </span>
    {/if}

    <p
      class="col-span-4 row-start-1 font-semibold text-slate-800 md:col-span-1 md:col-start-4 md:justify-self-end dark:text-gray-400"
    >
      {new Date(item.date).toISOString().slice(0, 10)}
    </p>
  </div>
</a>

<style>
  .post:hover {
    & h2 {
      @apply text-orange-600 dark:text-yellow-400;
    }
  }
</style>
