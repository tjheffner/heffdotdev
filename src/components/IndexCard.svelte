<script>
	export let href = '#';

	// gimme full item
	export let item;
	let date = new Date(item?.date).toISOString().slice(0, 10);
</script>

<a
	sveltekit:prefetch
	class="w-full text-gray-900 hover:text-yellow-600 dark:text-gray-100 dark:hover:text-yellow-100"
	href={'/' + item.slug}
	><div class="mb-8 w-full">
		<div class="flex flex-col justify-between items-center md:flex-row">
			<h4 class="mb-2 w-full flex-auto text-lg font-medium md:text-xl">
				{item.title}
			</h4>
			<div class="inline-flex flex-1 items-center">
				{#if item.ghMetadata && item.ghMetadata.reactions.total_count}
					<span
						class=" mr-2 min-w-[2rem] font-mono text-xs text-gray-700 text-opacity-70 dark:text-gray-300"
						>{item.ghMetadata.reactions.total_count} ♥</span
					>
				{/if}
				<p class="mb-4 w-32 text-left text-gray-500 md:mb-0 md:text-right">{date}</p>
			</div>
		</div>
		<p class="text-gray-600 dark:text-gray-400">
			{#if item.category}
				<span class="p-2 mr-2 border border-slate-500 rounded-md">{item.category}</span>
			{/if}
			<slot />
		</p>
	</div></a
>
