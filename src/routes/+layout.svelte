<script lang="ts">
  // App root. Owns the truly-global CSS (reset, :root vars, fonts) so it's
  // always present on every route — deterministic, regardless of which route
  // group you land on or navigate through.
  import '../global.css'
  import { afterNavigate } from '$app/navigation'

  let { children } = $props()

  // Tag <body> with the current route group. Group-specific theming in
  // global.css / christmas.css is gated behind this so it can only paint its
  // own group. hooks.server.ts sets the same attribute during SSR; this keeps
  // it correct across client-side navigation, which is what stops styles from
  // bleeding between (main) and (nowrapper) when following links.
  afterNavigate(({ to }) => {
    const id = to?.route?.id ?? ''
    document.body.dataset.group = id.includes('(nowrapper)') ? 'nowrapper' : 'main'
  })
</script>

{@render children?.()}
