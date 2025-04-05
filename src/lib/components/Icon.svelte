<script lang="ts">
  let { href = undefined, label = undefined, children } = $props();
</script>

<a
  class="m-1 inline-block rounded-lg
         transition-all duration-200
         ease-in-out
         bg-transparent
         text-accent
         ring-secondary
         hover:ring-2
         hover:bg-alternate
         hover:text-background
         "
  {href}
  aria-label={label}
>
  {@render children?.()}
</a>
