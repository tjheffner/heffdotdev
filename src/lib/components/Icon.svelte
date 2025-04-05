<script lang="ts">
  let { href = undefined, label = undefined, children } = $props();
</script>

<a
  class="m-1 inline-block rounded-lg
         transition-all duration-200
         ease-in-out
         bg-transparent
         text-accent
         hover:bg-accent
         hover:text-background
         "
  {href}
  aria-label={label}
>
  {@render children?.()}
</a>
