<script>
	export let href = undefined;
	export let label = undefined;
</script>

<a
	class="m-1 inline-block rounded-lg bg-yellow-400 text-yellow-800 ring-yellow-800
         transition-all duration-200
         ease-in-out hover:ring-2 dark:bg-yellow-800
         dark:text-yellow-100 dark:ring-yellow-400"
	{href}
	aria-label={label}
>
	<slot />
</a>
