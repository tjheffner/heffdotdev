<script>
  export let href = undefined
  export let label = undefined
</script>

<a
  class="m-1 inline-block rounded-lg
         transition-all duration-200
         ease-in-out hover:ring-2
         bg-transparent
         text-secondary
         ring-accent"
  {href}
  aria-label={label}
>
  <slot />
</a>
