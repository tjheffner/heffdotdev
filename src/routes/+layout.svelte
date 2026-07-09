<script lang="ts">
  // App root. Owns the truly-global CSS (reset, :root vars, fonts) so it's
  // always present on every route — deterministic, regardless of which route
  // group you land on or navigate through.
  import '../global.css'
  import { page } from '$app/state'

  let { children } = $props()

  // Tag <body> with the current route group. Group-specific theming in
  // global.css / christmas.css is gated behind this so it can only paint its
  // own group. hooks.server.ts sets the same attribute during SSR; this keeps
  // it in sync on the client, which stops styles bleeding between (main) and
  // (nowrapper).
  //
  // Derive it from page.route.id, which is authoritative on both hydration and
  // navigation. We used to read afterNavigate's `to.route.id`, but that is null
  // on the initial "enter" navigation after a hard refresh — so it flipped the
  // body from the correct SSR "nowrapper" back to "main" and leaked (main)
  // typography (notably h1) into playground pages.
  $effect(() => {
    const id = page.route.id ?? ''
    document.body.dataset.group = id.includes('(nowrapper)') ? 'nowrapper' : 'main'
  })
</script>

{@render children?.()}
