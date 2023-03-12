<script>
	export let href = '#';

	// gimme full item
	export let item;
</script>

<a data-sveltekit-prefetch class="post w-full" href={'/' + href}>
	<div class="grid grid-cols-4 px-0 pt-4 sm:p-4">
		<h2 class="col-span-4 sm:col-span-3 text-lg font-bold text-accent">{item.title}</h2>

		<p class="col-span-4 sm:col-span-3 mb-2 text-slate-800 dark:text-gray-400"><slot /></p>

		{#if item.category}
			<span
				class="col-span-1 col-start-1 mr-1 mb-2 inline-block
        w-fit rounded-full
        bg-orange-300 text-red-600
				px-2 py-1 text-xs
        font-bold text-white dark:bg-lime-600 dark:text-gray-900 md:mr-2 md:px-4
    "
			>
				{item.category}
			</span>
		{/if}

		<p
			class="col-span-4 md:col-span-1 md:col-start-4 row-start-1 md:justify-self-end font-semibold text-slate-800 dark:text-gray-400"
		>
			{new Date(item.date).toISOString().slice(0, 10)}
		</p>

		{#if item.ghMetadata && item.ghMetadata.reactions.total_count}
			<p class="md:col-span-1 md:col-start-4 md:justify-self-end text-accent">
				{item.ghMetadata.reactions.total_count} ♥
			</p>
		{/if}
	</div>
</a>

<style>
	.post:hover {
		& h2 {
			@apply text-orange-600 dark:text-yellow-400;
		}
	}
</style>
