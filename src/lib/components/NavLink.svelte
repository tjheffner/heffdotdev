<script>
  import { page } from '$app/stores'
  $: isActive = $page.url.pathname === $$props.href
  export let href
</script>

<a
  class={isActive
    ? 'footer-link my-4 block w-fit bg-[length:4px_50px] font-bold text-slate-900'
    : 'footer-link my-4 block w-fit font-bold'}
  {href}
>
  <slot />
</a>
