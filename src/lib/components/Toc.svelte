<script>
	import { onMount } from "svelte";

	export let tocStore;
	let isOpen = false;
	onMount(() => {
		// set isOpen if window width is mobile checking the media query
		if (window.matchMedia("(min-width: 640px)").matches) {
			isOpen = true;
		}
	})

  console.log($tocStore.items)
</script>

<!-- Table of contents thing -->
{#if Object.values($tocStore.items).length && Object.values($tocStore.items).length > 1}
	<section
		class="sticky top-8 h-0 mt-3 ml-9 max-w-[12em] rounded-xl"
	>
		{#if !isOpen}
			<button class="flex justify-center items-center z-50" on:click={() => (isOpen = !isOpen)}>
				<h2 class="text-orange-700 dark:text-orange-400">Table of <br /> Contents</h2>
			</button>
		{/if}
		{#if isOpen}
			<ul class="space-y-2 max-h-100 overflow-auto text-secondary">
				{#each Object.values($tocStore.items) as { id, text, element }}
					<a
						class="ml-2 block bg-opacity-25 text-sm"
						class:!text-accent={$tocStore.activeItem?.id === id}
            class:!font-bold={$tocStore.activeItem?.id === id}
            class:pl-2={element.nodeName === 'H2'}
            class:pl-4={element.nodeName === 'H3'}
						href="#{id}"
					>
						<li>{text}</li>
					</a>
				{/each}
			</ul>
		{/if}
	</section>
{/if}
