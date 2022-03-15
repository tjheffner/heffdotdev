<script>
	export let title = 'Untitled post';
</script>

<div class="mb-8 w-full">
	<div class="flex flex-col justify-between md:flex-row">
		<h4 class="mb-2 w-full flex-auto text-lg font-medium md:text-xl">
			{title}
		</h4>
	</div>
  <div class="flex flex-col justify-between md:flex-row">
  	<p class="text-gray-600 dark:text-gray-400">
  		<slot />
  	</p>
  </div>
</div>
