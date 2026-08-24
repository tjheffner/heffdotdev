<script lang="ts">
  import { Header } from '@hyzer-labs/ui'
  import { resize } from '@hyzer-labs/ui/observers'
  import NavLink from '$lib/components/NavLink.svelte'
  import { page } from '$app/state'

  const links = [
    { label: 'Posts', href: '/blog' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Playground', href: '/playground' },
    { label: 'About', href: '/about' },
  ]
  // ariaCurrent marks the active page and drives the active style
  // (global.css [aria-current] on the shared nav-link rule)
  const items = $derived(
    links.map((l) => ({
      ...l,
      ariaCurrent: page.url.pathname === l.href ? ('page' as const) : undefined,
    }))
  )

  // Publish the header's real occluding height so sticky bars below it (blog
  // filters, post-nav) sit flush underneath. Measured, not derived: the bar
  // mixes rem text with a px-sized toggle. The open drawer is absolutely
  // positioned, so include its bottom edge while it is open. The :root CSS
  // formula is only the pre-hydration fallback.
  let open = $state(false)
  let headerEl: HTMLElement | null = null

  function publish() {
    if (!headerEl) return
    let h = headerEl.offsetHeight
    const drawer = headerEl.querySelector<HTMLElement>('.hz-header-drawer')
    if (drawer && drawer.offsetHeight > 0) {
      h = drawer.getBoundingClientRect().bottom - headerEl.getBoundingClientRect().top
    }
    document.documentElement.style.setProperty('--header-height', `${Math.round(h)}px`)
  }

  // rides the component's restProps onto the <header> element; fires on mount
  // and any bar resize. publish() reads offsetHeight, which includes padding.
  const measure = resize((entry) => {
    headerEl = entry.target as HTMLElement
    publish()
  })

  // re-measure when the drawer toggles. effects run after the DOM updates
  $effect(() => {
    open
    publish()
  })
</script>

<a class="skip-link" href="#content">Skip to main content</a>

<!-- the drawer closes itself on link activation, so no remount needed -->
<Header
  {items}
  sticky
  mobileBreakpoint={668}
  ariaLabel="Primary"
  navItemClass="nav-link"
  id="header"
  class="site-header"
  bind:open
  {@attach measure}
>
    {#snippet logo()}
      <NavLink href="/">heffner.dev</NavLink>
    {/snippet}

    {#snippet menuIcon()}
      <!-- All three lines always render so they can transition. The two outer
           lines rotate into an X, the middle fades out. -->
      <svg
        class="menu-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <line class="line top" x1="4" y1="6" x2="20" y2="6" />
        <line class="line middle" x1="4" y1="12" x2="20" y2="12" />
        <line class="line bottom" x1="4" y1="18" x2="20" y2="18" />
      </svg>
    {/snippet}
  </Header>

<style>
  :global(.site-header) {
    padding: var(--hz-space-near) 0;
    background-color: var(--hz-color-surface);
  }

  /* the page-width wrapper, applied to the header's inner bar */
  :global(.site-header .hz-header-inner) {
    max-width: 65ch;
    margin: 0 var(--hz-space-near);
  }
  @media (width >= 768px) {
    :global(.site-header .hz-header-inner) {
      margin: 0 auto;
    }
  }

  /* bar links: right-aligned row */
  :global(.site-header .hz-nav-links) {
    justify-content: flex-end;
    gap: 1rem;
  }

  /* button reset only. the component owns the toggle's show/hide */
  :global(.site-header .hz-header-toggle) {
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    margin: 0;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
  }
  .menu-icon {
    display: block;
  }
  .line {
    /* Rotate/translate around each line's own centre. */
    transform-box: fill-box;
    transform-origin: center;
    transition:
      transform 0.3s ease,
      opacity 0.2s ease;
  }
  /* Hamburger -> X: top drops to the middle and tilts, bottom rises and
     counter-tilts, middle fades. Driven off the button's aria-expanded. */
  :global(.site-header .hz-header-toggle[aria-expanded='true']) .top {
    transform: translateY(6px) rotate(45deg);
  }
  :global(.site-header .hz-header-toggle[aria-expanded='true']) .middle {
    opacity: 0;
  }
  :global(.site-header .hz-header-toggle[aria-expanded='true']) .bottom {
    transform: translateY(-6px) rotate(-45deg);
  }

  /* Drawer as overlay panel: pulled out of flow so it floats over page content
     instead of pushing it down. It is inset to the wrapper column and hung off
     the nav bar. 100% of the header includes its bottom padding, hence the
     subtraction. */
  :global(.site-header .hz-header-drawer) {
    position: absolute;
    top: calc(100% - var(--hz-space-near));
    padding: calc(var(--hz-density) * 2) 0;
    background-color: var(--hz-color-surface);
    border-bottom: 2px solid var(--hz-intent-primary);
  }
  :global(.site-header .hz-header-drawer .hz-nav[data-orientation='vertical'] .hz-nav-links) {
    flex-direction: row;
    justify-content: space-between;
    margin-inline: var(--hz-space-near);
    gap: 1rem;
  }
  /* fade + slide on open. The drawer is display:none while closed, so the
     close direction cannot animate. @starting-style covers open only. */
  :global(.site-header .hz-header-drawer[data-state='open']) {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
    @starting-style {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .line,
    :global(.site-header .hz-header-drawer[data-state='open']) {
      transition: none;
    }
  }

  .skip-link {
    position: absolute;
    transform: translateX(-100%);
    z-index: 100;
    padding: 1rem;
  }
  .skip-link:focus {
    transform: translateX(10%);
    /* one off because the transparency of --brighter doesn't work as an overlay */
    background: oklch(0.82 0.07 271.3);
  }
</style>
