<script lang="ts">
  import { page } from '$app/stores'
  let { ...props } = $props();
  let isActive = $derived($page.url.pathname === props.href)
</script>

<a
  class={isActive
    ? 'footer-link my-4 block w-fit font-bold active'
    : 'footer-link my-4 block w-fit font-bold'}
  href={props.href}
>
  {@render props.children?.()}
</a>
