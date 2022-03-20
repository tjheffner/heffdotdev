<script>
	export let href = '#';

	// gimme full item
	export let item;
</script>

<a sveltekit:prefetch
	  class="project block w-full no-underline mb-8 !bg-unset"
    href={'/work/' + href}
>
  <div>
    <p class="font-bold text-lg text-indigo-700 dark:text-lime-500">{item.data.name}</p>

    <p class="text-slate-800 dark:text-gray-400 mb-2">{item.data.description}</p>
  </div>
</a>

<style>
	.project:hover {
		p {
			@apply text-orange-600 dark:text-yellow-400;
		}
	}
</style>
