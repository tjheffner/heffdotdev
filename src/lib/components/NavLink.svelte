<script lang="ts">
  import { Link } from '@hyzer-labs/ui'
  import { page } from '$app/state'

  let { href, children }: { href: string; children?: import('svelte').Snippet } = $props();
  // aria-current both marks the active page and drives the active style
  // (global.css .nav-link[aria-current])
  let isActive = $derived(page.url.pathname === href)
</script>

<Link {href} class="nav-link" ariaCurrent={isActive ? 'page' : undefined}>
  {@render children?.()}
</Link>
