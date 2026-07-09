<script lang="ts">
  import NavLink from '$lib/components/NavLink.svelte'
  import { afterNavigate } from '$app/navigation'

  // Below 668px the links collapse behind a toggle; at/above it they sit inline
  // and the toggle is hidden (see the media query). `open` only matters on mobile.
  let open = $state(false)

  // Close on any navigation — covers link taps (NavLink doesn't forward onclick)
  // as well as back/forward.
  afterNavigate(() => {
    open = false
  })
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') open = false
  }}
/>

<header class="header" id="header">
  <a class="skip-link" href="#content">Skip to main content</a>

  <div class="wrapper">
    <nav class="nav" data-density-shift aria-label="Primary">
      <div class="bar">
        <NavLink href="/">heffner.dev</NavLink>

        <button
          type="button"
          class="menu-toggle"
          aria-expanded={open}
          aria-controls="primary-links"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onclick={() => (open = !open)}
        >
          <!-- All three lines always render so they can transition; the two
               outer lines rotate/translate into an X, the middle fades out. -->
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
        </button>
      </div>

      <div class="links" id="primary-links" class:open data-density-shift>
        <NavLink href="/blog">Posts</NavLink>
        <NavLink href="/gallery">Gallery</NavLink>
        <NavLink href="/playground">Playground</NavLink>
        <NavLink href="/about">About</NavLink>
      </div>
    </nav>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    padding: var(--space-near) 0;
    background-color: var(--c-background);
    z-index: 10;
  }

  /* Mobile-first: the bar sits alone; the links float below it as an overlay. */
  .nav {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .bar {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .menu-toggle {
    display: inline-flex;
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
  .menu-toggle[aria-expanded='true'] .top {
    transform: translateY(6px) rotate(45deg);
  }
  .menu-toggle[aria-expanded='true'] .middle {
    opacity: 0;
  }
  .menu-toggle[aria-expanded='true'] .bottom {
    transform: translateY(-6px) rotate(-45deg);
  }

  /* Overlay panel: pulled out of flow so it floats over page content instead
     of pushing it down. */
  .links {
    display: flex;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: row;
    justify-content: space-around;
    gap: 1rem;
    padding: var(--space-away) 0;
    background-color: var(--c-background);
    border-bottom: 2px solid var(--c-accent);

    /* Hidden until open; fade + slide down. visibility is delayed on close so
       the fade-out can play before it leaves the a11y tree / tab order. */
    opacity: 0;
    transform: translateY(-0.5rem);
    visibility: hidden;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease,
      visibility 0s linear 0.2s;
  }
  .links.open {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease,
      visibility 0s;
  }

  /* At/above the site breakpoint: inline row, no toggle, no overlay. */
  @media (min-width: 668px) {
    .nav {
      position: static;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    .menu-toggle {
      display: none;
    }
    .links {
      display: flex;
      position: static;
      flex-direction: row;
      gap: 1rem;
      padding: 0;
      background-color: transparent;
      border-bottom: none;
      /* Reset the mobile overlay's animated-hidden state. */
      opacity: 1;
      transform: none;
      visibility: visible;
      transition: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .line,
    .links {
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
