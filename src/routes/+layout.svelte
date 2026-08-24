<script lang="ts">
  // Global CSS (reset, :root vars, fonts) lives here so every route gets it.
  // hyzer-tokens.css is generated from hyzer.config.ts and stands in for
  // @hyzer-labs/ui/tokens.css. Regenerate with `npm run tokens`, commit by hand.
  import '../hyzer-tokens.css'
  import '../global.css'
  import { page } from '$app/state'
  import { groupFor, themeFor } from '$lib/theme'

  let { children } = $props()

  // Tag <body> with the route group and palette theme. Group styles in
  // global.css / christmas.css are gated behind data-group; data-theme picks a
  // block in hyzer-tokens.css. hooks.server.ts sets both during SSR.
  // page.route.id is reliable on hydration and navigation. afterNavigate's
  // to.route.id is null on the first enter after a hard refresh, which flipped
  // the body to the wrong group and leaked (main) typography into playground.
  $effect(() => {
    const id = page.route.id
    document.body.dataset.group = groupFor(id)
    document.body.dataset.theme = themeFor(id)
  })

  // Images start on a grey placeholder (global.css). Clear it once the image
  // paints. `load` does not bubble but does fire on the way down, so one
  // capture-phase listener covers every image on the page with no per-image
  // wiring. A broken image never fires load, so it keeps its placeholder.
  $effect(() => {
    const onLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) e.target.dataset.loaded = ''
    }
    document.addEventListener('load', onLoad, true)
    // Anything already decoded before hydration will never fire load for us.
    // `complete` is true for a broken image too, hence the naturalWidth check.
    for (const img of document.querySelectorAll('img')) {
      if (img.complete && img.naturalWidth > 0) img.dataset.loaded = ''
    }
    return () => document.removeEventListener('load', onLoad, true)
  })
</script>

{@render children?.()}
