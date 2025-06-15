<script lang="ts">
	import { onMount } from "svelte";

  let { toc } = $props();
	let isOpen = $state(false);
	onMount(() => {
		// set isOpen if window width is mobile checking the media query
		if (window.matchMedia("(min-width: 640px)").matches) {
			isOpen = true;
		}
	})

</script>

<!-- Table of contents thing -->
{#if toc.items.size > 1}
	<section
		class="sticky max-w-[12em] top-10 h-0 z-10"
	>
    <button
      class="text-accent font-bold -ml-1 lg:ml-7"
      aria-label="{isOpen ? 'Close' : 'Open'} Table of Contents"
      onclick={() => (isOpen = !isOpen)}
    >
      {isOpen ? 'X' : '>'}
    </button>

      <!-- adjust margins to slide in/out, works with sticky -->
      <!-- need to adjust left margin to slide text, right margin to slide bg -->
			<ul class="toc-list max-h-fit {isOpen ? '-ml-6 mr-0 lg:ml-2 opacity-100' : '-ml-96 mr-96 opacity-0'}">
				{#each toc.items.values() as { id, text, element }}
          <li>
            <a
  						class="ml-2 block text-sm"
  						class:toc-active={toc.activeItem?.id === id}
              class:pl-2={element.nodeName === 'H2' || element.nodeName === 'H1'}
              class:pl-4={element.nodeName === 'H3'}
  						href="#{id}"
  					>
  					{text}
  					</a>
          </li>
				{/each}
			</ul>
	</section>
{/if}

<style>
  .toc-list {
    @apply text-secondary pb-5 px-8 -mt-5 space-y-1 overflow-auto transition-all duration-500;
		@apply bg-background;
  }
  .toc-active {
    @apply text-accent font-bold border-s-2 border-current;
  }
</style>
