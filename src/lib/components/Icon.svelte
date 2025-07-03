<script lang="ts">
  let { href = undefined, label = undefined, children } = $props();
</script>

<a
  class="icon"
  {href}
  aria-label={label}
>
  {@render children?.()}
</a>

<style>
  .icon {
    display: inline-block;
    width: 60px;
    border-radius: 8px;
    margin: .25rem;
    transition: all ease-in-out 200ms;
    /* background-color: transparent; */
    color: var(--c-accent);

    &:hover {
      background-color: var(--c-accent);
      color: var(--c-background);
    }
  }
</style>