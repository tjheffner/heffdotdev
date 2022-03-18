<script>
  export let href = undefined;
  export let label = undefined;
</script>

<a
  class="inline-block rounded-lg m-1 transition-all ease-in-out duration-200
         text-yellow-800 bg-yellow-400
         hover:ring-2 ring-yellow-800 dark:ring-yellow-400
         dark:bg-yellow-800 dark:text-yellow-100"
  href={href}
  aria-label={label}
>
  <slot />
</a>
