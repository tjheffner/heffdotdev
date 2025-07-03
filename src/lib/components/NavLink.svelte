<script lang="ts">
  import { page } from '$app/state'
  let { ...props } = $props();
  let isActive = $derived(page.url.pathname === props.href)
</script>

<a
  class={isActive
    ? 'nav-link active'
    : 'nav-link'}
  href={props.href}
>
  {@render props.children?.()}
</a>

<style>
  .nav-link {
    display: block;
    width: fit-content;
    font-weight: bold;
  }
</style>