<script>
  import NavLink from '$lib/components/NavLink.svelte'
</script>

<header class="header">
  <a class="skip-link" href="#content">Skip to main content</a>
  
  <div class="wrapper">
    <nav class="flex" data-density-shift>
      <NavLink href="/">heffner.dev</NavLink>

      <div class="flex" data-density-shift>
        <NavLink href="/blog">Posts</NavLink>
        <NavLink href="/gallery">Gallery</NavLink>
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
  }
  .flex {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 1rem;
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