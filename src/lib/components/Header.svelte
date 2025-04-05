<script>
import NavLink from '$lib/components/NavLink.svelte'
</script>

<div class="max-w-7xl mx-auto flex flex-col justify-center px-4 py-12 sm:px-8">
  <nav class="relative flex justify-between md:mx-4 lg:mx-12">
    <NavLink href="/">heffner.dev</NavLink>

    <div class="flex gap-2">
      <NavLink href="/blog">Posts</NavLink>
      <NavLink href="/gallery">Gallery</NavLink>
      <NavLink href="/about">About</NavLink>
    </div>
  </nav>
</div>
