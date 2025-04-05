<script lang="ts">
  import { page } from '$app/stores'
  let isActive = $derived($page.url.pathname === props.href)
  let { ...props } = $props();
</script>

<a
  class={isActive
    ? 'footer-link my-4 block w-fit bg-[length:4px_50px] font-bold text-secondary'
    : 'footer-link my-4 block w-fit font-bold'}
  {props.href}
>
  {@render props.children?.()}
</a>
