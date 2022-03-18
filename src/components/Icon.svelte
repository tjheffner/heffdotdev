<script>
  export let href = undefined;
  export let label = undefined;
</script>

<a
  class="inline-block rounded-lg transition-all ease-in-out duration-200
         text-black hover:bg-orange-400
         dark:text-blue-300 dark:hover:text-slate-900 dark:hover:bg-orange-800"
  href={href}
  aria-label={label}
>
  <slot />
</a>
