<script>
	export let href = '#';

	// gimme full item
	export let item;
</script>

<a
	sveltekit:prefetch
	class="project !bg-unset mb-8 block w-full no-underline"
	href={'/work/' + href}
>
	<div>
		<p class="text-lg font-bold text-sky-600 dark:text-lime-500">{item.data.name}</p>

		<p class="mb-2 text-slate-800 dark:text-gray-400">{item.data.description}</p>
	</div>
</a>

<style>
	.project:hover {
		& p {
			@apply text-orange-600 dark:text-yellow-400;
		}
	}
</style>
