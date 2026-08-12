<script lang="ts">
  // App root. Owns the truly-global CSS (reset, :root vars, fonts) so it's
  // always present on every route — deterministic, regardless of which route
  // group you land on or navigate through.
  // The generated token sheet stands in for @hyzer-labs/ui/tokens.css: the
  // same custom properties (--hz-*, no visual rules, so it can't leak styles
  // into either group) plus our three [data-theme] blocks. Authored in
  // hyzer.config.ts, regenerated with `npm run tokens`, committed by hand.
  // global.css loads after it so the --hz-space aliases there win.
  import '../hyzer-tokens.css'
  import '../global.css'
  import { page } from '$app/state'
  import { groupFor, themeFor } from '$lib/theme'

  let { children } = $props()

  // Tag <body> with the current route group and palette theme. Group-specific
  // theming in global.css / christmas.css is gated behind data-group so it can
  // only paint its own group; data-theme selects a block in hyzer-tokens.css.
  // hooks.server.ts sets the same two attributes during SSR from the same
  // helpers; this keeps them in sync on the client, which stops styles bleeding
  // between (main) and (nowrapper).
  //
  // Derive them from page.route.id, which is authoritative on both hydration and
  // navigation. We used to read afterNavigate's `to.route.id`, but that is null
  // on the initial "enter" navigation after a hard refresh — so it flipped the
  // body from the correct SSR "nowrapper" back to "main" and leaked (main)
  // typography (notably h1) into playground pages.
  $effect(() => {
    const id = page.route.id
    document.body.dataset.group = groupFor(id)
    document.body.dataset.theme = themeFor(id)
  })
</script>

{@render children?.()}
