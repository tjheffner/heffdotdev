<script>
	export let href = '#';

	// gimme full item
	export let item;
</script>

<a sveltekit:prefetch
	  class="w-full"
    href={'/' + item.slug}
>
  <div class="grid grid-cols-4 p-4">
    <h2 class="col-span-3 font-bold text-lg text-accent">{item.title}</h2>

    <p class="col-span-3 text-slate-800 dark:text-gray-400 mb-2"><slot /></p>

		{#if item.category}
    <span class="col-span-1 col-start-1 w-fit inline-block rounded-full
        bg-amber-600 text-white
        dark:bg-lime-600 dark:text-gray-900
        text-xs font-bold
        mr-1 md:mr-2 mb-2 px-2 md:px-4 py-1
    ">
        {item.category}
    </span>
		{/if}

    <p class="col-span-1 col-start-4 row-start-1 justify-self-end text-slate-800 dark:text-gray-400 font-semibold">
			{new Date(item.date).toISOString().slice(0, 10)}
		</p>

    {#if item.ghMetadata && item.ghMetadata.reactions.total_count}
      <p class="col-span-1 col-start-4 justify-self-end text-accent">
        {item.ghMetadata.reactions.total_count} ♥
      </p>
    {/if}

  </div>
</a>
