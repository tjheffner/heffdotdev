<script>
  export let href = '#'

  // gimme full item
  export let item
</script>

<a data-sveltekit-prefetch class="post w-full" href={'/' + href}>
  <div class="grid grid-cols-4 px-0 m-6">
    <div class="col-span-4 sm:col-span-3 row-start-1">
      <h2 class="text-lg font-bold text-accent">
        {item.title}
      </h2>

      <p class="mb-2 text-copy">
        <slot />
      </p>
    </div>

    <div
      class="col-span-4 row-start-1 md:col-span-1 md:col-start-4 md:row-start-1 md:row-span-2 md:justify-self-end w-full text-right"
    >
      <p class="font-semibold text-copy mb-1">{new Date(item.date).toISOString().slice(0, 10)}</p>

      {#if item.category}
        <span
          class="
          w-fit rounded-full
          bg-secondary px-2
          py-1 text-background font-bold
          md:px-4
        ">
          {item.category}
        </span>
      {/if}
    </div>
  </div>
</a>

<style>
  .post:hover {
    & h2 {
      @apply text-secondary;
    }
  }
</style>
