<script>
	export let title;
</script>

<div class="slice py-8 mb-8 w-full">
  {#if title}
	<div class="flex flex-col justify-between md:flex-row">
		<h2 class="mb-2 w-full flex-auto text-lg prose font-medium dark:prose-invert md:text-xl">
			{title}
		</h2>
	</div>
  {/if}
  <div class="flex flex-col justify-between md:flex-row">
  	<p class="text-gray-600 dark:text-gray-400">
  		<slot />
  	</p>
  </div>
</div>
