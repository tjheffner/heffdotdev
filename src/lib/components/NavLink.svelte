<script lang="ts">
  import { page } from '$app/state'
  let { ...props } = $props();
  let isActive = $derived(page.url.pathname === props.href)
</script>

<a
  class={isActive
    ? 'footer-link active'
    : 'footer-link'}
  href={props.href}
>
  {@render props.children?.()}
</a>

<style>
  .footer-link {
    margin: 1rem 0;
    display: block;
    width: fit-content;
    font-weight: bold;
  }
</style>