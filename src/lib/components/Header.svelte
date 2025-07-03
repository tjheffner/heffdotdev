<script>
  import NavLink from '$lib/components/NavLink.svelte'
</script>

<div class="wrapper header">
  <nav class="flex" data-density-shift>
    <NavLink href="/">heffner.dev</NavLink>

    <div class="flex" data-density-shift>
      <NavLink href="/blog">Posts</NavLink>
      <NavLink href="/gallery">Gallery</NavLink>
      <NavLink href="/about">About</NavLink>
    </div>
  </nav>
</div>

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
</style>