<script>
  // gimme full item
  export let item
  export let prefix
</script>

<a
  data-sveltekit-prefetch
  class="project !bg-unset mb-8 block w-full no-underline"
  href={prefix ? '/work/' + item.slug : item.slug}
>
  <div>
    <p class="text-lg font-bold text-orange-600 dark:text-lime-500">
      {item.name}
    </p>

    <p class="mb-2 text-slate-800 dark:text-gray-400">{item.description}</p>
  </div>
</a>

<style>
  .project:hover {
    & p {
      @apply text-secondary;
    }
  }
</style>
